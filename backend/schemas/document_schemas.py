from pydantic import BaseModel
from typing import Optional


class QualifyDocumentRequest(BaseModel):
    status: str
    observacoes: Optional[str] = None


class UploadDocumentRequest(BaseModel):
    fileName: str
