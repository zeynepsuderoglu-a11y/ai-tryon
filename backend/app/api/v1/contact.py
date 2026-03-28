from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.core.email import send_contact_email

router = APIRouter(prefix="/contact", tags=["contact"])


class ContactRequest(BaseModel):
    name: str
    surname: str
    email: EmailStr
    phone: str = ""
    message: str
    kvkk: bool


@router.post("", status_code=200)
async def send_contact(data: ContactRequest):
    if not data.kvkk:
        raise HTTPException(status_code=400, detail="KVKK onayı zorunludur.")
    if not data.name.strip() or not data.message.strip():
        raise HTTPException(status_code=400, detail="Ad ve mesaj alanları zorunludur.")

    await send_contact_email(
        name=data.name.strip(),
        surname=data.surname.strip(),
        email=data.email,
        phone=data.phone.strip(),
        message=data.message.strip(),
    )
    return {"message": "Mesajınız iletildi. En kısa sürede dönüş yapacağız."}
