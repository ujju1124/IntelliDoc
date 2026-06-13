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
            # Try every value that is a list — return the first non-empty one
            for key in ("items", "insights", "key_insights", "keyInsights",
                        "questions", "suggested_questions", "debate_questions",
                        "results", "data"):
                if key in data and isinstance(data[key], list) and data[key]:
                    return data[key]
            # Last resort: return the first list value found in the dict
            for val in data.values():
                if isinstance(val, list) and val:
                    return val
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
        # Uses the summary (already generated) as grounding so the LLM
        # stays anchored to THIS document's actual topic, not UBI or any other example.
        questions_raw = call_groq_api(
            f"""Generate exactly 4 debate questions that are specific to the document described below.

Rules:
- Each question MUST reference a concrete topic, claim, policy, person, data point, or concept from this specific document
- Questions must be genuinely debatable — not simple factual lookups
- Do NOT write generic questions like "What are the main arguments?" or "What are the weaknesses?"
- Each question should open a different angle of debate

Document summary (use this to understand the topic):
{summary}

Document content (use this for specific details):
{context}

Return ONLY a JSON array of 4 strings, no markdown, no explanation:
["question 1", "question 2", "question 3", "question 4"]""",
            model="llama-3.1-8b-instant",
            json_mode=True
        )

        suggested_questions = _parse_json_list(questions_raw, fallback=[
            "What is the central thesis of this document?",
            "What evidence supports the main claims here?",
            "What counterarguments does this document fail to address?",
            "What are the real-world implications of this document's conclusions?",
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
