from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal, Optional
import uuid


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Şifre en az 8 karakter olmalıdır.")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Şifre en az 8 karakter olmalıdır.")
        return v


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class BillingProfile(BaseModel):
    type: Literal["individual", "corporate"]
    full_name: Optional[str] = None
    city: str
    district: str
    tc_no: Optional[str] = None
    company_name: Optional[str] = None
    tax_no: Optional[str] = None
    tax_office: Optional[str] = None
    address: Optional[str] = None


class BillingUpdateRequest(BaseModel):
    billing_profile: BillingProfile


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    credits_remaining: int
    is_active: bool
    billing_profile: Optional[dict] = None

    model_config = {"from_attributes": True}
