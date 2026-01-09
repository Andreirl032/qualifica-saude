from pydantic import BaseModel
from typing import Optional


class LoginCpfRequest(BaseModel):
    cpf: str
    password: str


class ContactHintRequest(BaseModel):
    cpf: str


class RequestOtpRequest(BaseModel):
    cpf: str
    email: Optional[str] = None


class SetPasswordRequest(BaseModel):
    cpf: str
    otp: str
    password: str


class RefreshTokenRequest(BaseModel):
    refreshToken: str


class RegisterRequest(BaseModel):
    name: Optional[str] = 'Usuário'
    email: Optional[str] = None
    cpf: Optional[str] = None
    role: str
    password: Optional[str] = '123456'
