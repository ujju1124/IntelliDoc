"""Router for document ingestion API."""
from fastapi import APIRouter, UploadFile, File, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.schemas import IngestResponse
from app.services.ingestion_service import ingest_document

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document_endpoint(
    file: UploadFile = File(...),
    strategy: str = Query(..., description="Chunking strategy: 'fixed' or 'sentence'"),
    db: Session = Depends(get_db)
) -> IngestResponse:
    """Ingest a PDF or TXT document and store embeddings in Pinecone."""
    
    try:
        # Validate file type
        if not (file.filename.endswith('.pdf') or file.filename.endswith('.txt')):
            raise HTTPException(status_code=400, detail="Only .pdf and .txt files are supported")
        
        # Validate strategy
        if strategy not in ["fixed", "sentence"]:
            raise HTTPException(status_code=400, detail="Strategy must be 'fixed' or 'sentence'")
        
        # Read file content
        file_content = await file.read()
        
        # Process document
        document_id, chunk_count = ingest_document(
            file_content=file_content,
            filename=file.filename,
            strategy=strategy,
            db=db
        )
        
        return IngestResponse(
            document_id=document_id,
            filename=file.filename,
            chunk_count=chunk_count,
            strategy=strategy
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
