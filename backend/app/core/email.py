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


async def send_contact_email(
    name: str, surname: str, email: str, phone: str, message: str
) -> None:
    html = f"""
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fafafa">
      <h2 style="color:#1a1a1a;font-size:18px;margin-bottom:4px">Yeni İletişim Formu Mesajı</h2>
      <p style="color:#a3a3a3;font-size:12px;margin-bottom:24px">studyoima.com/iletisim</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5">
        <tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:10px 16px;font-size:12px;color:#737373;width:100px">Ad Soyad</td>
          <td style="padding:10px 16px;font-size:14px;color:#1a1a1a">{name} {surname}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:10px 16px;font-size:12px;color:#737373">E-Posta</td>
          <td style="padding:10px 16px;font-size:14px;color:#1a1a1a">
            <a href="mailto:{email}" style="color:#c9a96e;text-decoration:none">{email}</a>
          </td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:10px 16px;font-size:12px;color:#737373">Telefon</td>
          <td style="padding:10px 16px;font-size:14px;color:#1a1a1a">{phone if phone else "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:12px;color:#737373;vertical-align:top">Mesaj</td>
          <td style="padding:10px 16px;font-size:14px;color:#1a1a1a;white-space:pre-wrap">{message}</td>
        </tr>
      </table>
      <p style="color:#a3a3a3;font-size:11px;margin-top:20px">
        Yanıtlamak için doğrudan bu e-postayı iletebilir veya {email} adresine yazabilirsiniz.
      </p>
    </div>
    """
    await send_email("ilgi@ilet.in", f"İletişim Formu: {name} {surname}", html)


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
