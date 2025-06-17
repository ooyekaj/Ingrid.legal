from docx import Document
import io
from typing import Union

class DocumentConverter:
    """
    Utility class for converting Document objects to different formats
    """
    
    @staticmethod
    def to_bytes(document: Document) -> bytes:
        """
        Convert a python-docx Document object to bytes
        
        Args:
            document: Document object from python-docx
            
        Returns:
            bytes: Document as bytes for API response or file operations
        """
        doc_bytes = io.BytesIO()
        document.save(doc_bytes)
        doc_bytes.seek(0)
        return doc_bytes.getvalue()
    
    @staticmethod
    def to_base64(document: Document) -> str:
        """
        Convert a python-docx Document object to base64 string
        
        Args:
            document: Document object from python-docx
            
        Returns:
            str: Document as base64 encoded string
        """
        import base64
        doc_bytes = DocumentConverter.to_bytes(document)
        return base64.b64encode(doc_bytes).decode('utf-8')
    
    @staticmethod
    def to_stream(document: Document) -> io.BytesIO:
        """
        Convert a python-docx Document object to BytesIO stream
        
        Args:
            document: Document object from python-docx
            
        Returns:
            io.BytesIO: Document as BytesIO stream
        """
        doc_bytes = io.BytesIO()
        document.save(doc_bytes)
        doc_bytes.seek(0)
        return doc_bytes
    
    @staticmethod
    def save_to_file(document: Document, filepath: str) -> None:
        """
        Save a python-docx Document object to file
        
        Args:
            document: Document object from python-docx
            filepath: Path where to save the document
        """
        document.save(filepath)