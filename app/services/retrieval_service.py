"""Service for retrieving relevant chunks from Pinecone."""
from typing import List
from app.core.embeddings import embed
from app.core.pinecone_client import pinecone_index


def retrieve_relevant_chunks(user_message: str, document_id: str, top_k: int = 5) -> List[str]:
    """Query Pinecone to retrieve top-K most relevant chunks for a user message."""

    # Embed the query using the shared singleton model
    query_embedding = embed([user_message])[0]

    # Query Pinecone with document_id filter
    response = pinecone_index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        filter={"document_id": {"$eq": document_id}}
    )

    return [
        match.metadata["text"]
        for match in response.matches
        if "text" in match.metadata
    ]
