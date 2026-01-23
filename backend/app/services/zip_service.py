import zipfile
import io
from typing import List, Tuple


class ZipService:
    """Service for creating ZIP files."""
    
    @staticmethod
    def create_zip_from_files(files: List[Tuple[str, bytes]]) -> bytes:
        """
        Create a ZIP file from a list of (filename, content) tuples.
        
        Args:
            files: List of (filename, content_bytes) tuples
        
        Returns:
            ZIP file as bytes
        """
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for filename, content in files:
                zip_file.writestr(filename, content)
        
        zip_buffer.seek(0)
        return zip_buffer.getvalue()
