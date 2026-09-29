"""
Phase 8 — trainer content processing pipeline:
    upload -> extract text -> clean -> chunk -> (embed) -> store

Embeddings are left as null for now: no real embedding model is wired up
(AI_PROVIDER=mock), and a fake vector would be actively misleading for
semantic search. The `ContentChunk.embedding` column is ready for
whichever real embedding call replaces this later — nothing about the
schema or downstream chunk-retrieval code needs to change when it does.
"""

import re

from sqlalchemy.orm import Session

from app.models.assessment import ContentChunk, UploadedMaterial
from app.services.text_extraction import extract_text

CHUNK_SIZE_CHARS = 1200
CHUNK_OVERLAP_CHARS = 150


def _clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _chunk_text(text: str, size: int = CHUNK_SIZE_CHARS, overlap: int = CHUNK_OVERLAP_CHARS) -> list[str]:
    if len(text) <= size:
        return [text] if text else []

    chunks = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = end - overlap
    return chunks


def process_material(db: Session, material: UploadedMaterial) -> list[ContentChunk]:
    """Extracts, cleans, and chunks a material's file, storing ContentChunk rows."""
    raw_text = extract_text(material.storage_path, material.file_type)
    cleaned = _clean_text(raw_text)
    pieces = _chunk_text(cleaned)

    # Clear any previous chunks (e.g. reprocessing).
    db.query(ContentChunk).filter(ContentChunk.material_id == material.id).delete()

    chunks = []
    for idx, piece in enumerate(pieces):
        chunk = ContentChunk(material_id=material.id, chunk_index=idx, text=piece, embedding=None)
        db.add(chunk)
        chunks.append(chunk)

    material.processed = True
    db.add(material)
    db.commit()
    for c in chunks:
        db.refresh(c)
    return chunks
