"""Pydantic schemas for request and response validation."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Ingestion API schemas
class IngestResponse(BaseModel):
    """Response schema for document ingestion."""
    document_id: str
    filename: str
    chunk_count: int
    strategy: str


# Chat API schemas
class ChatRequest(BaseModel):
    """Request schema for chat endpoint."""
    session_id: str
    user_message: str
    document_id: str


class BookingData(BaseModel):
    """Schema for extracted booking information."""
    name: Optional[str] = None
    email: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None


class ChatResponse(BaseModel):
    """Response schema for chat endpoint."""
    response: str
    session_id: str
    booking: Optional[BookingData] = None


# Session History API schemas
class SessionSummary(BaseModel):
    """Response schema for session list."""
    session_id: str
    document_id: str
    document_name: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    
    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Response schema for individual message."""
    id: int
    role: str
    content: str
    has_booking: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Internal schemas
class ChunkMetadata(BaseModel):
    """Metadata for a document chunk."""
    chunk_index: int
    source_filename: str
    strategy: str
    document_id: str
    text: str
