"""Service for managing chat history in Redis and database."""
from typing import List, Optional
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.redis_client import get_redis_client
from app.models.db_models import ChatSession, ChatMessage


def get_chat_history(session_id: str, max_messages: int = 6) -> List[dict]:
    """Retrieve chat history for a session from Redis."""
    redis_client = get_redis_client()
    key = f"chat:{session_id}"
    
    # Get the last N messages
    messages_json = redis_client.lrange(key, -max_messages, -1)
    
    messages = []
    for msg_json in messages_json:
        messages.append(json.loads(msg_json))
    
    return messages


def add_message_to_history(session_id: str, role: str, content: str) -> None:
    """Add a message to chat history in Redis."""
    redis_client = get_redis_client()
    key = f"chat:{session_id}"
    
    message = {
        "role": role,
        "content": content
    }
    
    # Append message to list
    redis_client.rpush(key, json.dumps(message))
    
    # Set expiration to 24 hours (86400 seconds)
    redis_client.expire(key, 86400)


def save_conversation_turn(session_id: str, user_message: str, assistant_response: str) -> None:
    """Save both user message and assistant response to Redis."""
    add_message_to_history(session_id, "user", user_message)
    add_message_to_history(session_id, "assistant", assistant_response)


# ==================== DATABASE FUNCTIONS FOR PERSISTENT HISTORY ====================

def save_message_to_db(
    session_id: str,
    role: str,
    content: str,
    has_booking: bool,
    db: Session
) -> ChatMessage:
    """Save a single message to the database."""
    message = ChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        has_booking=has_booking
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def create_session_in_db(
    session_id: str,
    document_id: str,
    document_name: str,
    db: Session
) -> ChatSession:
    """Create a new chat session in the database."""
    session = ChatSession(
        session_id=session_id,
        document_id=document_id,
        document_name=document_name
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def update_session_timestamp(session_id: str, db: Session) -> None:
    """Update the updated_at timestamp for a session."""
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if session:
        session.updated_at = datetime.utcnow()
        db.commit()


def get_or_create_session(
    session_id: str,
    document_id: str,
    document_name: str,
    db: Session
) -> ChatSession:
    """Get existing session or create new one."""
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        session = create_session_in_db(session_id, document_id, document_name, db)
    return session


def set_session_title(session_id: str, title: str, db: Session) -> None:
    """Set the title for a session (first 50 chars of first user message)."""
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if session and session.title is None:
        # Truncate to 50 characters
        session.title = title[:50] if len(title) > 50 else title
        db.commit()


def delete_session_from_redis(session_id: str) -> None:
    """Delete a session from Redis."""
    redis_client = get_redis_client()
    key = f"chat:{session_id}"
    redis_client.delete(key)

