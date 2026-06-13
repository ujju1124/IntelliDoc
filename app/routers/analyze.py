"""Router for document intelligence analysis."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.retrieval_service import retrieve_relevant_chunks
from app.services.llm_service import call_groq_api
import json

router = APIRouter()


class AnalyzeRequest(BaseModel):
    document_id: str


class AnalyzeResponse(BaseModel):
    document_id: str
    summary: str
    insights: list
    mindmap: dict
    suggested_questions: list  # doc-specific debate starters


# ─── helpers ─────────────────────────────────────────────────────────────────

def _parse_json_list(raw: str, fallback: list) -> list:
    """Strip markdown fences, parse JSON, return list or fallback."""
    cleaned = raw.replace('```json', '').replace('```', '').strip()
    try:
        data = json.loads(cleaned)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for key in ("items", "insights", "key_insights", "keyInsights",
                        "questions", "suggested_questions", "results"):
                if key in data and isinstance(data[key], list):
                    return data[key]
    except (json.JSONDecodeError, ValueError):
        # line-by-line fallback
        lines = []
        for line in raw.strip().split('\n'):
            c = line.strip().lstrip('-*0123456789.)').strip('"\'').strip()
            if c and len(c) > 10:
                lines.append(c)
        if lines:
            return lines
    return fallback


# ─── endpoint ─────────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_document(request: AnalyzeRequest):
    """
    Generate intelligence dashboard for a document:
    - Auto summary
    - Key insights (always exactly 5)
    - Mind map visualization data
    - 4 document-specific suggested debate questions
    """
    try:
        retrieved_chunks = retrieve_relevant_chunks(
            user_message="main topics and key points",
            document_id=request.document_id,
            top_k=10
        )

        if not retrieved_chunks:
            raise HTTPException(
                status_code=404,
                detail=f"No content found for document_id: {request.document_id}"
            )

        context = "\n".join(retrieved_chunks)

        # ── 1. Summary ────────────────────────────────────────────────────────
        summary = call_groq_api(
            f"""Provide a concise 3-4 sentence summary of this document.

Context:
{context}

Summary:""",
            model="llama-3.1-8b-instant"
        )

        # ── 2. Insights ───────────────────────────────────────────────────────
        insights_raw = call_groq_api(
            f"""Based on this document, provide exactly 5 key insights as a JSON array of strings.

Document:
{context}

Return format (JSON array only, no markdown):
["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"]""",
            model="llama-3.1-8b-instant",
            json_mode=True
        )
        print(f"[DEBUG] Raw insights: {insights_raw[:200]}")

        insights = _parse_json_list(insights_raw, fallback=[
            "This document contains key information worth exploring further",
            "Multiple important concepts are discussed in this document",
            "The document presents several noteworthy perspectives",
            "Key themes emerge throughout the document content",
            "Further analysis of this document is recommended",
        ])

        # Normalise to exactly 5
        while len(insights) < 5:
            insights.append(f"Additional insight from the document (point {len(insights) + 1})")
        insights = insights[:5]

        # ── 3. Mind map ───────────────────────────────────────────────────────
        mindmap_raw = call_groq_api(
            f"""Create a mind map structure for this document as JSON.
Return ONLY valid JSON, no markdown, no backticks.

Required format:
{{
  "central": "main topic",
  "branches": [
    {{"label": "branch 1", "children": ["child1", "child2", "child3"]}},
    {{"label": "branch 2", "children": ["child1", "child2", "child3"]}},
    {{"label": "branch 3", "children": ["child1", "child2", "child3"]}}
  ]
}}

Context:
{context}""",
            model="llama-3.1-8b-instant",
            json_mode=True
        )

        mindmap = None
        try:
            cleaned = mindmap_raw.replace('```json', '').replace('```', '').strip()
            mindmap = json.loads(cleaned)
            if "central" not in mindmap or not isinstance(mindmap.get("branches"), list):
                raise ValueError("bad structure")
        except Exception:
            mindmap = {
                "central": "Document Overview",
                "branches": [
                    {"label": "Key Topics",      "children": ["Topic 1", "Topic 2", "Topic 3"]},
                    {"label": "Main Arguments",  "children": ["Argument 1", "Argument 2", "Argument 3"]},
                    {"label": "Implications",    "children": ["Implication 1", "Implication 2", "Implication 3"]},
                ]
            }

        # ── 4. Suggested debate questions (document-specific) ─────────────────
        questions_raw = call_groq_api(
            f"""Based on this document, generate exactly 4 thought-provoking debate questions that would spark interesting discussion.
Questions should be specific to the document content, not generic.

Document:
{context}

Return ONLY a JSON array of 4 question strings, no markdown:
["question 1", "question 2", "question 3", "question 4"]""",
            model="llama-3.1-8b-instant",
            json_mode=True
        )

        suggested_questions = _parse_json_list(questions_raw, fallback=[
            "What are the main arguments presented in this document?",
            "What are the key weaknesses in this document's reasoning?",
            "What are the broader implications of this document's conclusions?",
            "What alternative perspectives are missing from this document?",
        ])[:4]

        while len(suggested_questions) < 4:
            suggested_questions.append("What are the broader implications of this document?")

        return AnalyzeResponse(
            document_id=request.document_id,
            summary=summary,
            insights=insights,
            mindmap=mindmap,
            suggested_questions=suggested_questions,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
