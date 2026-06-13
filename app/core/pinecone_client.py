"""Pinecone vector database client initialization."""
from pinecone import Pinecone, ServerlessSpec
from app.core.config import settings

# Initialize Pinecone client
pc = Pinecone(api_key=settings.PINECONE_API_KEY)


def get_pinecone_index():
    """Get or create Pinecone index."""
    index_name = settings.PINECONE_INDEX_NAME
    
    # Check if index exists, if not create it
    existing_indexes = [index.name for index in pc.list_indexes()]
    
    if index_name not in existing_indexes:
        pc.create_index(
            name=index_name,
            dimension=384,  # all-MiniLM-L6-v2 produces 384-dimensional embeddings
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
    
    return pc.Index(index_name)


# Global index instance
pinecone_index = get_pinecone_index()
