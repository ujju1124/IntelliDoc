"""Embedding service using HuggingFace Inference API.

Uses the free hosted all-MiniLM-L6-v2 endpoint — no local model loaded,
zero RAM overhead. Produces 384-dim vectors (same as before).

No API key required for the free tier (rate limited but sufficient).
"""
import requests

HF_API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"


def embed(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings via HuggingFace Inference API."""
    # HF feature-extraction endpoint returns nested lists
    response = requests.post(
        HF_API_URL,
        json={"inputs": texts, "options": {"wait_for_model": True}},
        timeout=30,
    )
    response.raise_for_status()
    result = response.json()

    # Result shape depends on input:
    # - single string → [float, float, ...]  (1D)
    # - list of strings → [[float,...], [float,...]]  (2D)
    # Sentence-transformers model returns mean-pooled [batch, 384]
    if isinstance(result, list) and len(result) > 0:
        if isinstance(result[0], list) and isinstance(result[0][0], list):
            # Shape: [batch, tokens, 384] — mean pool over tokens
            return [
                [sum(col) / len(col) for col in zip(*token_vecs)]
                for token_vecs in result
            ]
        elif isinstance(result[0], list) and isinstance(result[0][0], float):
            # Shape: [batch, 384] — already pooled
            return result
        elif isinstance(result[0], float):
            # Shape: [384] — single input returned as flat list
            return [result]

    raise ValueError(f"Unexpected embedding response shape: {type(result)}")
