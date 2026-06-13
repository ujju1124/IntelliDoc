"""Embedding service using Groq API — no local model, zero RAM overhead.

Uses Groq's nomic-embed-text-v1.5 which produces 768-dim vectors.
NOTE: Pinecone index dimension must match — 768 for this model.

If you previously used all-MiniLM-L6-v2 (384-dim) locally, you need to
re-create your Pinecone index with dimension=768, or re-ingest all documents.
"""
from groq import Groq
from app.core.config import settings

_client: Groq | None = None

EMBED_MODEL = "nomic-embed-text-v1.5"
EMBED_DIM = 768


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def embed(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings using Groq API. Returns list of float vectors."""
    client = _get_client()

    # Groq embedding API accepts up to 2048 texts per request
    # but we batch in 100s to stay safe
    all_embeddings = []
    batch_size = 100

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        response = client.embeddings.create(
            model=EMBED_MODEL,
            input=batch,
        )
        # response.data is a list of EmbeddingObject sorted by index
        batch_embeddings = [item.embedding for item in sorted(response.data, key=lambda x: x.index)]
        all_embeddings.extend(batch_embeddings)

    return all_embeddings
