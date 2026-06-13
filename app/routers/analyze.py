"""Router for document intelligence analysis."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.retrieval_service import retrieve_relevant_chunks
from app.services.llm_service import call_groq_api
import json
import re

router = APIRouter()


class AnalyzeRequest(BaseModel):
    document_id: str


class AnalyzeResponse(BaseModel):
    document_id: str
    summary: str
    insights: list
    mindmap: dict
    suggested_questions: list


# ─── helpers ─────────────────────────────────────────────────────────────────

def _strip_fences(raw: str) -> str:
    """Remove markdown code fences and leading/trailing whitespace."""
    return raw.replace('```json', '').replace('```', '').strip()


def _parse_json_list(raw: str, fallback: list) -> list:
    """Parse a JSON array from LLM output with multi-layer fallback."""
    cleaned = _strip_fences(raw)
    try:
        data = json.loads(cleaned)
        if isinstance(data, list):
            return [item for item in data if isinstance(item, str) and item.strip()]
        if isinstance(data, dict):
            # Try known keys first, then any list value
            for key in ("items", "insights", "key_insights", "keyInsights",
                        "questions", "suggested_questions", "debate_questions",
                        "results", "data"):
                if key in data and isinstance(data[key], list) and data[key]:
                    return data[key]
            for val in data.values():
                if isinstance(val, list) and val:
                    return val
    except (json.JSONDecodeError, ValueError):
        pass

    # Line-by-line text fallback
    lines = []
    for line in raw.strip().split('\n'):
        c = line.strip().lstrip('-*0123456789.)').strip('"\'').strip()
        if c and len(c) > 10:
            lines.append(c)
    return lines if lines else fallback


def _parse_mindmap(raw: str, topic_fallback: str) -> dict:
    """Parse mindmap JSON with robust fallback — never raises, never returns None."""
    cleaned = _strip_fences(raw)

    # Try to extract a JSON object even if the response has extra text
    json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if json_match:
        cleaned = json_match.group(0)

    try:
        data = json.loads(cleaned)
        if isinstance(data, dict) and "central" in data and isinstance(data.get("branches"), list):
            # Validate each branch has label + children
            valid_branches = []
            for b in data["branches"]:
                if isinstance(b, dict) and "label" in b:
                    children = b.get("children", [])
                    if not isinstance(children, list):
                        children = []
                    valid_branches.append({
                        "label": str(b["label"]),
                        "children": [str(c) for c in children if c]
                    })
            if valid_branches:
                return {"central": str(data["central"]), "branches": valid_branches}
    except (json.JSONDecodeError, ValueError, TypeError):
        pass

    # Fallback uses actual topic from summary so it's not hardcoded
    return {
        "central": topic_fallback,
        "branches": [
            {"label": "Key Concepts",   "children": ["Concept 1", "Concept 2", "Concept 3"]},
            {"label": "Main Arguments", "children": ["Argument 1", "Argument 2", "Argument 3"]},
            {"label": "Implications",   "children": ["Implication 1", "Implication 2", "Implication 3"]},
        ]
    }


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
        # json_mode=True is safe here because the prompt asks for a simple array
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

        while len(insights) < 5:
            insights.append(f"Additional insight from the document (point {len(insights) + 1})")
        insights = insights[:5]

        # ── 3. Mind map ───────────────────────────────────────────────────────
        # NOTE: json_mode=False here — Groq rejects mindmap JSON too often because
        # the nested structure is harder for the LLM to get exactly right.
        # We parse manually with _parse_mindmap which is more tolerant.
        mindmap_raw = call_groq_api(
            f"""Create a mind map for this document. Return ONLY a JSON object.
No markdown, no backticks, no explanation — just the raw JSON object.

The JSON must follow this exact structure:
{{
  "central": "short main topic (3-5 words)",
  "branches": [
    {{"label": "branch name", "children": ["item 1", "item 2", "item 3"]}},
    {{"label": "branch name", "children": ["item 1", "item 2", "item 3"]}},
    {{"label": "branch name", "children": ["item 1", "item 2", "item 3"]}}
  ]
}}

Document context:
{context}""",
            model="llama-3.1-8b-instant",
            json_mode=False   # ← plain text, we parse manually
        )

        # Extract topic from summary for a meaningful fallback
        topic_fallback = summary.split('.')[0].strip()[:40] if summary else "Document Overview"
        mindmap = _parse_mindmap(mindmap_raw, topic_fallback)

        # ── 4. Suggested debate questions ─────────────────────────────────────
        # json_mode=False — same reason as mindmap, safer to parse manually
        questions_raw = call_groq_api(
            f"""Generate exactly 4 debate questions that are specific to the document described below.

Rules:
- Each question MUST reference a concrete topic, claim, or concept from THIS document
- Questions must be genuinely debatable, not factual lookups
- Do NOT write generic questions like "What are the main arguments?"
- Each question should open a different angle of debate

Document summary:
{summary}

Document content:
{context}

Return ONLY a JSON array of 4 strings:
["question 1", "question 2", "question 3", "question 4"]""",
            model="llama-3.1-8b-instant",
            json_mode=False   # ← plain text, we parse manually
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
