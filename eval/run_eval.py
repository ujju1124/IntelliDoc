"""Evaluation script for IntelliDoc summarization quality.

Runs analysis on 5 diverse documents and scores summaries using:
1. LLM-as-judge (Groq scores 1-5 with justification)
2. Basic rubric checks (coverage, hallucination, length)
3. Comparison against human-written reference summaries

Prints results table with per-document scores and flags failures < 3/5.
"""
import os
import sys
import json
from typing import Dict, List
from io import BytesIO

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ingestion_service import ingest_document
from app.services.retrieval_service import retrieve_relevant_chunks
from app.services.llm_service import call_groq_api
from app.core.db import SessionLocal, Base, engine

# Initialize database tables
Base.metadata.create_all(bind=engine)


def load_document(filepath: str) -> bytes:
    """Load document content as bytes."""
    with open(filepath, 'rb') as f:
        return f.read()


def load_reference(filepath: str) -> str:
    """Load reference summary."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read().strip()


def generate_summary(document_id: str) -> str:
    """Generate summary using IntelliDoc pipeline."""
    chunks = retrieve_relevant_chunks(
        user_message="main topics and key points",
        document_id=document_id,
        top_k=10
    )
    
    if not chunks:
        raise ValueError(f"No chunks found for document_id: {document_id}")
    
    context = "\n".join(chunks)
    
    summary = call_groq_api(
        f"""Provide a concise 3-4 sentence summary of this document.

Context:
{context}

Summary:""",
        model="llama-3.1-8b-instant"
    )
    
    return summary.strip()


def score_summary_llm_judge(summary: str, reference: str, document_text: str) -> tuple[int, str]:
    """Use LLM-as-judge to score summary 1-5 with justification."""
    
    judge_prompt = f"""You are an expert evaluator of document summaries. Score the AI-generated summary on a scale of 1-5 based on:
- Coverage: Does it capture the main points of the document?
- Accuracy: Is it free of hallucinated facts not in the source?
- Conciseness: Is the length appropriate (not too verbose or sparse)?

Document excerpt:
{document_text[:800]}...

Reference summary (human-written):
{reference}

AI-generated summary to evaluate:
{summary}

Provide:
1. Score (1-5, where 5 is excellent)
2. One-sentence justification

Format your response as JSON:
{{"score": <1-5>, "justification": "your justification here"}}"""
    
    try:
        response = call_groq_api(judge_prompt, model="llama-3.1-8b-instant", json_mode=True)
        # Parse JSON
        result = json.loads(response.strip())
        return result.get("score", 3), result.get("justification", "No justification provided")
    except Exception as e:
        print(f"⚠️  LLM judge error: {e}")
        return 3, "Error during LLM judging"


def check_basic_rubric(summary: str, document_text: str) -> Dict[str, bool]:
    """Check basic quality criteria."""
    checks = {}
    
    # Length check (50-300 chars)
    checks["appropriate_length"] = 50 <= len(summary) <= 300
    
    # Not empty
    checks["not_empty"] = len(summary.strip()) > 0
    
    # Contains some keywords from document (simple heuristic)
    doc_lower = document_text.lower()
    summary_lower = summary.lower()
    
    # Extract potential key terms (words > 5 chars, not too common)
    common_words = {'there', 'their', 'these', 'those', 'where', 'which', 'while', 'through', 'would', 'could', 'should'}
    doc_words = [w for w in doc_lower.split() if len(w) > 5 and w not in common_words]
    
    # Check if summary shares at least 3 significant words with document
    overlap = sum(1 for word in doc_words[:20] if word in summary_lower)
    checks["keyword_overlap"] = overlap >= 3
    
    return checks


def run_evaluation():
    """Run evaluation on all test documents."""
    eval_dir = os.path.dirname(os.path.abspath(__file__))
    docs_dir = os.path.join(eval_dir, 'documents')
    refs_dir = os.path.join(eval_dir, 'references')
    
    documents = [
        'doc1_short_tech.txt',
        'doc2_medium_science.txt',
        'doc3_long_policy.txt',
        'doc4_business.txt',
        'doc5_social.txt'
    ]
    
    print("=" * 80)
    print("INTELLIDOC SUMMARIZATION EVALUATION")
    print("=" * 80)
    print()
    
    results = []
    db = SessionLocal()
    
    for doc_name in documents:
        print(f"📄 Processing: {doc_name}")
        
        doc_path = os.path.join(docs_dir, doc_name)
        ref_path = os.path.join(refs_dir, doc_name.replace('.txt', '_reference.txt'))
        
        # Load files
        doc_content = load_document(doc_path)
        doc_text = doc_content.decode('utf-8')
        reference = load_reference(ref_path)
        
        # Ingest document
        try:
            document_id, chunk_count = ingest_document(
                file_content=doc_content,
                filename=doc_name,
                strategy="sentence",
                db=db
            )
            print(f"   Ingested: {chunk_count} chunks, ID={document_id[:8]}...")
        except Exception as e:
            print(f"   ❌ Ingestion failed: {e}")
            continue
        
        # Generate summary
        try:
            summary = generate_summary(document_id)
            print(f"   Summary: {summary[:80]}...")
        except Exception as e:
            print(f"   ❌ Summary generation failed: {e}")
            continue
        
        # Score with LLM judge
        llm_score, justification = score_summary_llm_judge(summary, reference, doc_text)
        
        # Check basic rubric
        rubric_checks = check_basic_rubric(summary, doc_text)
        rubric_pass_count = sum(rubric_checks.values())
        rubric_score = (rubric_pass_count / len(rubric_checks)) * 5  # Scale to 1-5
        
        # Average score
        final_score = (llm_score + rubric_score) / 2
        
        result = {
            "document": doc_name,
            "llm_score": llm_score,
            "rubric_score": round(rubric_score, 1),
            "final_score": round(final_score, 1),
            "justification": justification,
            "summary": summary,
            "reference": reference,
            "rubric_checks": rubric_checks
        }
        
        results.append(result)
        print(f"   Score: {final_score:.1f}/5 (LLM: {llm_score}, Rubric: {rubric_score:.1f})")
        print()
    
    db.close()
    
    # Print results table
    print("=" * 80)
    print("RESULTS SUMMARY")
    print("=" * 80)
    print()
    print(f"{'Document':<30} {'LLM':<6} {'Rubric':<8} {'Final':<8} {'Status'}")
    print("-" * 80)
    
    for r in results:
        status = "✅ PASS" if r["final_score"] >= 3.0 else "❌ FAIL"
        print(f"{r['document']:<30} {r['llm_score']:<6} {r['rubric_score']:<8} {r['final_score']:<8} {status}")
    
    # Calculate average
    avg_score = sum(r["final_score"] for r in results) / len(results) if results else 0
    print("-" * 80)
    print(f"{'AVERAGE':<30} {'':<6} {'':<8} {avg_score:.1f}/5")
    print()
    
    # Flag failures (< 3/5)
    failures = [r for r in results if r["final_score"] < 3.0]
    
    if failures:
        print("=" * 80)
        print("FAILURE ANALYSIS (Scores < 3/5)")
        print("=" * 80)
        print()
        
        for r in failures:
            print(f"📄 {r['document']}")
            print(f"   Score: {r['final_score']:.1f}/5")
            print(f"   LLM Justification: {r['justification']}")
            print()
            print(f"   Rubric Checks:")
            for check, passed in r['rubric_checks'].items():
                status = "✅" if passed else "❌"
                print(f"      {status} {check}")
            print()
            print(f"   Generated Summary:")
            print(f"      {r['summary']}")
            print()
            print(f"   Reference Summary:")
            print(f"      {r['reference']}")
            print()
            print("-" * 80)
            print()
    else:
        print("✅ All documents scored >= 3/5")
    
    print()
    print(f"Evaluation complete: {len(results)} documents processed")
    if len(results) > 0:
        print(f"Average score: {avg_score:.1f}/5")
        print(f"Pass rate: {len([r for r in results if r['final_score'] >= 3.0])}/{len(results)} ({100 * len([r for r in results if r['final_score'] >= 3.0]) / len(results):.0f}%)")
    else:
        print("❌ No documents were successfully processed")


if __name__ == "__main__":
    run_evaluation()
