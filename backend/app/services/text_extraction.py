"""
Phase 8 — text extraction from uploaded trainer materials.

One function per supported format, all normalized to return a single
string of extracted text. Chunking happens separately (see
content_pipeline.py) so extraction and chunking can be tested/swapped
independently.
"""

from pathlib import Path

from app.models.assessment import MaterialType


def extract_text(file_path: str, file_type: MaterialType) -> str:
    if file_type == MaterialType.PDF:
        return _extract_pdf(file_path)
    if file_type == MaterialType.PPTX:
        return _extract_pptx(file_path)
    if file_type == MaterialType.DOCX:
        return _extract_docx(file_path)
    raise ValueError(f"Text extraction not supported for {file_type}")


def _extract_pdf(file_path: str) -> str:
    import fitz  # PyMuPDF

    text_parts = []
    with fitz.open(file_path) as doc:
        for page in doc:
            text_parts.append(page.get_text())
    return "\n".join(text_parts)


def _extract_pptx(file_path: str) -> str:
    from pptx import Presentation

    prs = Presentation(file_path)
    text_parts = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                text_parts.append(shape.text_frame.text)
    return "\n".join(text_parts)


def _extract_docx(file_path: str) -> str:
    import docx

    document = docx.Document(file_path)
    return "\n".join(p.text for p in document.paragraphs)


def guess_material_type(filename: str) -> MaterialType:
    suffix = Path(filename).suffix.lower()
    mapping = {
        ".pdf": MaterialType.PDF,
        ".pptx": MaterialType.PPTX,
        ".docx": MaterialType.DOCX,
    }
    if suffix not in mapping:
        raise ValueError(f"Unsupported file type: {suffix}")
    return mapping[suffix]
