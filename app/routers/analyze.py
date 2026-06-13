"""Router for document intelligence analysis."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.retrieval_service import retrieve_relevant_chunks
from app.services.llm_service import call_groq_api
import json

router = APIRouter()


class AnalyzeRequest(BaseModel):
    """Request model for document analysis."""
    document_id: str


class AnalyzeResponse(BaseModel):
    """Response model for document analysis."""
    document_id: str
    summary: str
    insights: list
    mindmap: dict


@router.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_document(request: AnalyzeRequest):
    """
    Generate intelligence dashboard for a document:
    - Auto summary
    - Key insights
    - Mind map visualization data
    """
    
    try:
        # Retrieve relevant chunks from Pinecone with a general query
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
        
        # Step 1: Generate summary
        summary_prompt = f"""Provide a concise 3-4 sentence summary of this document.

Context:
{context}

Summary:"""
        
        summary = call_groq_api(summary_prompt, model="llama3-8b-8192")
        
        # Step 2: Generate key insights
        insights_prompt = f"""Extract 5-7 key insights from this document as a JSON array.
Each insight is a string. Return JSON only, no explanation.

Context:
{context}

Format: ["insight 1", "insight 2", "insight 3", ...]

JSON:"""
        
        insights_response = call_groq_api(insights_prompt, model="llama3-8b-8192", json_mode=True)
        
        # Parse insights JSON
        try:
            insights_data = json.loads(insights_response)
            # Handle different possible JSON formats
            if isinstance(insights_data, dict):
                insights = insights_data.get("insights", [])
            elif isinstance(insights_data, list):
                insights = insights_data
            else:
                insights = []
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            insights = [
                "Key insight 1 from the document",
                "Key insight 2 from the document",
                "Key insight 3 from the document"
            ]
        
        # Step 3: Generate mind map data
        mindmap_prompt = f"""Create a mind map structure for this document as JSON.

Format:
{{
  "central": "main topic",
  "branches": [
    {{
      "label": "branch name",
      "children": ["child1", "child2", "child3"]
    }}
  ]
}}

Return JSON only, no explanation.

Context:
{context}

JSON:"""
        
        mindmap_response = call_groq_api(mindmap_prompt, model="llama3-8b-8192", json_mode=True)
        
        # Parse mindmap JSON
        try:
            mindmap = json.loads(mindmap_response)
            # Validate structure
            if "central" not in mindmap or "branches" not in mindmap:
                raise ValueError("Invalid mindmap structure")
        except (json.JSONDecodeError, ValueError):
            # Fallback mindmap structure
            mindmap = {
                "central": "Document Overview",
                "branches": [
                    {
                        "label": "Main Topics",
                        "children": ["Topic 1", "Topic 2", "Topic 3"]
                    },
                    {
                        "label": "Key Points",
                        "children": ["Point 1", "Point 2", "Point 3"]
                    }
                ]
            }
        
        return AnalyzeResponse(
            document_id=request.document_id,
            summary=summary,
            insights=insights,
            mindmap=mindmap
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
