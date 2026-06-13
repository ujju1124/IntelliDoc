"""Pinecone vector database client initialization."""
from pinecone import Pinecone, ServerlessSpec
from app.core.config import settings

# Embedding dimension must match the model used in app/core/embeddings.py
# nomic-embed-text-v1.5 (Groq API) → 768 dimensions
VECTOR_DIM = 768

# Initialize Pinecone client
pc = Pinecone(api_key=settings.PINECONE_API_KEY)


def get_pinecone_index():
    """Get or create Pinecone index with correct dimensions."""
    index_name = settings.PINECONE_INDEX_NAME

    existing = {idx.name: idx for idx in pc.list_indexes()}

    if index_name not in existing:
        # Create new index with correct dimensions
        pc.create_index(
            name=index_name,
            dimension=VECTOR_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    else:
        # Verify dimension matches — if not, warn but continue
        # (user must delete and recreate the index manually if dimension changed)
        existing_dim = existing[index_name].dimension
        if existing_dim != VECTOR_DIM:
            print(f"[WARNING] Pinecone index '{index_name}' has dimension {existing_dim} "
                  f"but embeddings model produces {VECTOR_DIM}-dim vectors. "
                  f"Delete and recreate the index in Pinecone dashboard.")

    return pc.Index(index_name)


# Global index instance — initialised once at module load
pinecone_index = get_pinecone_index()
