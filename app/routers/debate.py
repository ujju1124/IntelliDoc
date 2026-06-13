"""Router for multi-agent debate."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.debate_service import run_debate

router = APIRouter()


class DebateRequest(BaseModel):
    """Request model for multi-agent debate."""
    session_id: str
    user_message: str
    document_id: str


class DebateResponse(BaseModel):
    """Response model for multi-agent debate."""
    session_id: str
    user_message: str
    debate: dict


@router.post("/debate", response_model=DebateResponse, tags=["Debate"])
async def debate_endpoint(request: DebateRequest):
    """
    Multi-agent debate panel:
    - Summarizer: factual response from document
    - Critic: challenges assumptions and finds weaknesses
    - Devil's Advocate: argues opposite perspective
    - Moderator: synthesizes all perspectives into final verdict
    
    Agents respond sequentially, each reacting to previous agents.
    """
    
    try:
        # Validate inputs
        if not request.session_id or not request.user_message or not request.document_id:
            raise HTTPException(
                status_code=400,
                detail="session_id, user_message, and document_id are required"
            )
        
        # Run the multi-agent debate
        result = run_debate(
            session_id=request.session_id,
            user_message=request.user_message,
            document_id=request.document_id
        )
        
        return DebateResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Debate execution failed: {str(e)}"
        )
