"""Lazy-loaded embedding model.

The model is NOT loaded at import time — only on the first embed() call.
This keeps startup RAM near zero so Render free tier (512MB) doesn't OOM.
The model loads once and stays cached for all subsequent requests.
"""
from fastembed import TextEmbedding

_model: TextEmbedding | None = None


def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        # BAAI/bge-small-en-v1.5: ~25MB ONNX model, 384-dim output
        # Downloads once to ~/.cache/fastembed on first call
        _model = TextEmbedding(
            model_name="BAAI/bge-small-en-v1.5",
            max_length=512,
        )
    return _model


def embed(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings. Returns list of 384-dim float vectors."""
    model = _get_model()
    return [e.tolist() for e in model.embed(texts)]
