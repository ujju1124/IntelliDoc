"""Service for retrieving relevant chunks from Pinecone."""
from typing import List
from sentence_transformers import SentenceTransformer
from app.core.pinecone_client import pinecone_index

# Use the same embedding model as ingestion
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')


def retrieve_relevant_chunks(user_message: str, document_id: str, top_k: int = 5) -> List[str]:
    """Query Pinecone to retrieve top K most relevant chunks for a user message."""
    
    # Step 1: Generate embedding for user message
    query_embedding = embedding_model.encode([user_message])[0].tolist()
    
    # Step 2: Query Pinecone with document_id filter
    query_response = pinecone_index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        filter={"document_id": {"$eq": document_id}}
    )
    
    # Step 3: Extract text from matches
    chunks = []
    for match in query_response.matches:
        if 'text' in match.metadata:
            chunks.append(match.metadata['text'])
    
    return chunks
