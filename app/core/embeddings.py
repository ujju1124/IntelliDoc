"""Shared singleton embedding model — loaded once, reused everywhere."""
from sentence_transformers import SentenceTransformer

# Single instance shared by ingestion_service and retrieval_service.
# Loading SentenceTransformer is expensive (~2s, ~90MB RAM) so we do it once at startup.
_model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def embed(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings and return float vectors."""
    model = get_embedding_model()
    return model.encode(texts, convert_to_tensor=False).tolist()
