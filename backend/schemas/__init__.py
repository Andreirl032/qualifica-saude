from schemas.auth_schemas import LoginRequest
from schemas.user_schemas import (
    LoginCpfRequest,
    ContactHintRequest,
    RequestOtpRequest,
    SetPasswordRequest,
    RefreshTokenRequest,
    RegisterRequest
)
from schemas.document_schemas import (
    QualifyDocumentRequest,
    UploadDocumentRequest
)

__all__ = [
    'LoginRequest',
    'LoginCpfRequest',
    'ContactHintRequest',
    'RequestOtpRequest',
    'SetPasswordRequest',
    'RefreshTokenRequest',
    'RegisterRequest',
    'QualifyDocumentRequest',
    'UploadDocumentRequest'
]
