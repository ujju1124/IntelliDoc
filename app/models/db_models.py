"""SQLAlchemy database models for documents and bookings."""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class Document(Base):
    """Document metadata table."""
    __tablename__ = "documents"
    
    document_id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow)
    chunk_count = Column(Integer, nullable=False)
    strategy = Column(String, nullable=False)
    file_hash = Column(String, nullable=True, index=True)  # SHA-256 for de-duplication
    
    # Relationship to chat sessions
    sessions = relationship("ChatSession", back_populates="document")


class Booking(Base):
    """Interview booking table."""
    __tablename__ = "bookings"
    
    booking_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    date = Column(String, nullable=True)
    time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatSession(Base):
    """Chat session table for persistent history."""
    __tablename__ = "chat_sessions"
    
    session_id = Column(String, primary_key=True, index=True)
    document_id = Column(String, ForeignKey("documents.document_id"), nullable=False, index=True)
    document_name = Column(String, nullable=False)
    title = Column(String, nullable=True)  # First user message truncated to 50 chars
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    """Chat message table for persistent history."""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("chat_sessions.session_id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(String, nullable=False)
    has_booking = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    session = relationship("ChatSession", back_populates="messages")
