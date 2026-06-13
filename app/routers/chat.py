"""Router for conversational RAG API."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.schemas import ChatRequest, ChatResponse
from app.services.retrieval_service import retrieve_relevant_chunks
from app.services.memory_service import (
    get_chat_history, 
    save_conversation_turn,
    get_or_create_session,
    save_message_to_db,
    update_session_timestamp,
    set_session_title
)
from app.services.llm_service import generate_rag_response
from app.services.booking_service import process_booking
from app.models.db_models import Document

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db)
) -> ChatResponse:
    """Conversational RAG endpoint with booking detection."""
    
    try:
        # Get document name for session creation
        document = db.query(Document).filter(Document.document_id == request.document_id).first()
        if not document:
            raise HTTPException(
                status_code=404, 
                detail=f"Document not found: {request.document_id}"
            )
        
        # Get or create chat session in DB
        get_or_create_session(
            session_id=request.session_id,
            document_id=request.document_id,
            document_name=document.filename,
            db=db
        )
        
        # Step 1: Retrieve relevant chunks from Pinecone
        context_chunks = retrieve_relevant_chunks(
            user_message=request.user_message,
            document_id=request.document_id,
            top_k=5
        )
        
        if not context_chunks:
            raise HTTPException(
                status_code=404, 
                detail=f"No relevant context found for document_id: {request.document_id}"
            )
        
        # Step 2: Fetch chat history from Redis
        chat_history = get_chat_history(request.session_id, max_messages=6)
        
        # Step 3: Generate RAG response using Groq
        assistant_response = generate_rag_response(
            context_chunks=context_chunks,
            chat_history=chat_history,
            user_message=request.user_message
        )
        
        # Step 4: Save conversation to Redis
        save_conversation_turn(
            session_id=request.session_id,
            user_message=request.user_message,
            assistant_response=assistant_response
        )
        
        # Step 5: Check for booking intent and extract information
        booking_data = process_booking(
            db=db,
            session_id=request.session_id,
            user_message=request.user_message,
            chat_history=chat_history
        )
        
        # Step 6: Save messages to database for persistent history
        has_booking = booking_data is not None
        
        # Save user message
        save_message_to_db(
            session_id=request.session_id,
            role="user",
            content=request.user_message,
            has_booking=False,
            db=db
        )
        
        # Save assistant response
        save_message_to_db(
            session_id=request.session_id,
            role="assistant",
            content=assistant_response,
            has_booking=has_booking,
            db=db
        )
        
        # Set session title if this is the first message
        if not chat_history:  # First message in the session
            set_session_title(request.session_id, request.user_message, db)
        
        # Update session timestamp
        update_session_timestamp(request.session_id, db)
        
        # Build response
        response = ChatResponse(
            response=assistant_response,
            session_id=request.session_id,
            booking=booking_data
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
