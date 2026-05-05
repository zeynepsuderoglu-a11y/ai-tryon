import logging
import httpx
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html: str) -> None:
    """Resend API (birincil) veya SMTP (yedek) ile e-posta gönderir."""
    if settings.RESEND_API_KEY:
        await _send_via_resend(to, subject, html)
    elif settings.SMTP_USER and settings.SMTP_PASSWORD:
        await _send_via_smtp(to, subject, html)
    else:
        logger.warning("[EMAIL] Gönderim yapılandırılmamış. Alıcı: %s | Konu: %s", to, subject)


async def _send_via_resend(to: str, subject: str, html: str) -> None:
    """Resend.com API — SPF/DKIM imzalı, spam'e düşmez."""
    from_addr = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"from": from_addr, "to": [to], "subject": subject, "html": html},
        )
    if resp.status_code not in (200, 201):
        logger.error("[EMAIL/Resend] Gönderim başarısız: %s %s", resp.status_code, resp.text)
        raise RuntimeError(f"E-posta gönderilemedi: {resp.status_code}")
    logger.info("[EMAIL/Resend] Gönderildi → %s", to)


async def _send_via_smtp(to: str, subject: str, html: str) -> None:
    """Gmail SMTP yedek — Resend yapılandırılmamışsa kullanılır."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
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
    logger.info("[EMAIL/SMTP] Gönderildi → %s", to)


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


async def send_verification_email(to: str, code: str) -> None:
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 32px">
      <p style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 8px 0">E-posta Doğrulama</p>
      <p style="color:#737373;font-size:14px;margin:0 0 32px 0">
        StudyoİMA AI hesabınızı oluşturmak için aşağıdaki kodu kullanın.
      </p>
      <div style="background:#f5f5f5;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px">
        <p style="color:#737373;font-size:11px;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.15em">
          Doğrulama Kodu
        </p>
        <p style="color:#1a1a1a;font-size:40px;font-weight:800;letter-spacing:0.35em;margin:0;font-variant-numeric:tabular-nums">
          {code}
        </p>
      </div>
      <p style="color:#a3a3a3;font-size:12px;margin:0 0 8px 0">
        Bu kod <strong>10 dakika</strong> geçerlidir.
      </p>
      <p style="color:#a3a3a3;font-size:12px;margin:0">
        Talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
      </p>
    </div>
    """
    await send_email(to, "Doğrulama Kodunuz — StudyoİMA AI", html)


async def send_password_reset_email(to: str, reset_url: str) -> None:
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 32px">
      <p style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 8px 0">Şifre Sıfırlama</p>
      <p style="color:#737373;font-size:14px;margin:0 0 28px 0">
        StudyoİMA AI hesabınız için şifre sıfırlama talebinde bulundunuz.<br>
        Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
      </p>
      <a href="{reset_url}"
         style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;
                padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600">
        Şifremi Sıfırla
      </a>
      <p style="color:#a3a3a3;font-size:12px;margin-top:28px">
        Bu link <strong>1 saat</strong> geçerlidir. Talebi siz yapmadıysanız görmezden gelebilirsiniz.
      </p>
    </div>
    """
    await send_email(to, "Şifre Sıfırlama — StudyoİMA AI", html)
