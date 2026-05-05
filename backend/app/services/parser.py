import os
from markitdown import MarkItDown
import tempfile

async def parse_to_markdown(file_bytes: bytes, file_extension: str) -> str:
    """
    Converts a resume file (PDF/DOCX) to Markdown using MarkItDown.
    """
    md = MarkItDown()
    
    # Create a temporary file to store the bytes
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
        tmp_file.write(file_bytes)
        tmp_path = tmp_file.name
    
    try:
        result = md.convert(tmp_path)
        return result.text_content
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
