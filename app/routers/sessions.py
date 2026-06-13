"""Router for chat session history management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.db import get_db
from app.models.schemas import SessionSummary, MessageResponse
from app.models.db_models import ChatSession, ChatMessage
from app.services.memory_service import delete_session_from_redis

router = APIRouter()


@router.get("/sessions", response_model=List[SessionSummary])
async def get_all_sessions(db: Session = Depends(get_db)) -> List[SessionSummary]:
    """Get all chat sessions ordered by most recent activity."""
    
    # Query sessions with message count
    sessions = (
        db.query(
            ChatSession,
            func.count(ChatMessage.id).label("message_count")
        )
        .outerjoin(ChatMessage, ChatSession.session_id == ChatMessage.session_id)
        .group_by(ChatSession.session_id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    
    result = []
    for session, message_count in sessions:
        result.append(SessionSummary(
            session_id=session.session_id,
            document_id=session.document_id,
            document_name=session.document_name,
            title=session.title or "New Conversation",
            created_at=session.created_at,
            updated_at=session.updated_at,
            message_count=message_count
        ))
    
    return result


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db)
) -> List[MessageResponse]:
    """Get all messages for a specific session."""
    
    # Check if session exists
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
    
    # Get all messages ordered by creation time
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    
    return [
        MessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            has_booking=msg.has_booking,
            created_at=msg.created_at
        )
        for msg in messages
    ]


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """Delete a chat session and all its messages."""
    
    # Check if session exists
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
    
    # Delete from database (cascade will delete messages automatically)
    db.delete(session)
    db.commit()
    
    # Delete from Redis
    delete_session_from_redis(session_id)
    
    return {
        "deleted": True,
        "session_id": session_id
    }
