import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings


async def send_email(to: str, subject: str, html: str) -> None:
    """Send an email via SMTP. Silently skips if SMTP is not configured."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL] SMTP not configured. Would send to {to}: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to
    msg.attach(MIMEText(html, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )


async def send_password_reset_email(to: str, reset_url: str) -> None:
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#1a1a1a;font-size:20px;margin-bottom:8px">Şifre Sıfırlama</h2>
      <p style="color:#737373;font-size:14px;margin-bottom:24px">
        İMA Tryon hesabınız için şifre sıfırlama talebinde bulundunuz.<br>
        Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
      </p>
      <a href="{reset_url}"
         style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;
                padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        Şifremi Sıfırla
      </a>
      <p style="color:#a3a3a3;font-size:12px;margin-top:24px">
        Bu link 1 saat geçerlidir. Talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
      </p>
    </div>
    """
    await send_email(to, "Şifre Sıfırlama — İMA Tryon", html)
