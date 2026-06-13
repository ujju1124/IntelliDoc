"""Pinecone vector database client — lazy initialization.

Index is connected on first use, not at import time.
This prevents startup crashes if Pinecone is slow to respond.
"""
from pinecone import Pinecone, ServerlessSpec
from app.core.config import settings

VECTOR_DIM = 384  # BAAI/bge-small-en-v1.5 output dimension

_index = None


def get_pinecone_index():
    """Get Pinecone index, creating it if it doesn't exist."""
    global _index
    if _index is not None:
        return _index

    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index_name = settings.PINECONE_INDEX_NAME

    existing = {idx.name: idx for idx in pc.list_indexes()}

    if index_name not in existing:
        pc.create_index(
            name=index_name,
            dimension=VECTOR_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    else:
        existing_dim = getattr(existing[index_name], 'dimension', None)
        if existing_dim and existing_dim != VECTOR_DIM:
            print(f"[WARNING] Pinecone index dimension mismatch: "
                  f"index={existing_dim}, model={VECTOR_DIM}. "
                  f"Delete and recreate the index.")

    _index = pc.Index(index_name)
    return _index


# Module-level alias — lazily resolved on first call
class _LazyIndex:
    def __getattr__(self, name):
        return getattr(get_pinecone_index(), name)

    def query(self, *args, **kwargs):
        return get_pinecone_index().query(*args, **kwargs)

    def upsert(self, *args, **kwargs):
        return get_pinecone_index().upsert(*args, **kwargs)


pinecone_index = _LazyIndex()
