"""Router for document history and management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.db import get_db
from app.models.db_models import Document

router = APIRouter()


class DocumentSummary(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    strategy: str
    upload_time: datetime

    class Config:
        from_attributes = True


@router.get("/documents", response_model=list[DocumentSummary], tags=["Documents"])
def list_documents(db: Session = Depends(get_db)):
    """Return all ingested documents ordered by most recent first."""
    docs = db.query(Document).order_by(Document.upload_time.desc()).all()
    return docs


@router.delete("/documents/{document_id}", tags=["Documents"])
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document record from SQLite (does not remove Pinecone vectors)."""
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"deleted": document_id}
