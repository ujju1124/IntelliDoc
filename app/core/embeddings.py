"""Embedding service using FastEmbed (ONNX-based, no PyTorch).

FastEmbed runs all-MiniLM-L6-v2 via ONNX Runtime which uses ~150MB RAM
vs sentence-transformers + torch which requires ~500MB+.
Produces identical 384-dim vectors.
"""
from fastembed import TextEmbedding

_model: TextEmbedding | None = None


def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        # Downloads ~30MB ONNX model on first call, cached after that
        _model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    return _model


def embed(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings. Returns list of 384-dim float vectors."""
    model = _get_model()
    embeddings = list(model.embed(texts))
    return [e.tolist() for e in embeddings]
