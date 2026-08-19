import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv


load_dotenv()


class EmailService:
    """SMTP üzerinden e-posta gönderen servis."""

    def __init__(self):
        self.enabled = (
            os.getenv("SMTP_ENABLED", "false").lower()
            == "true"
        )

        self.host = os.getenv(
            "SMTP_HOST",
            "smtp.gmail.com",
        )

        self.port = int(
            os.getenv("SMTP_PORT", "587"),
        )

        self.username = os.getenv(
            "SMTP_USERNAME",
        )

        self.password = os.getenv(
            "SMTP_PASSWORD",
        )

        self.sender = os.getenv(
            "SMTP_FROM",
            self.username,
        )

    def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
    ) -> bool:
        """E-posta gönderir; test modunda gerçek gönderim yapmaz."""

        if not self.enabled:
            print(
                "SMTP test modu aktif; "
                "e-posta gönderilmedi."
            )
            return False

        if not self.username or not self.password:
            raise RuntimeError(
                "SMTP kullanıcı adı veya şifresi eksik."
            )

        message = EmailMessage()
        message["From"] = self.sender
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(
            self.host,
            self.port,
            timeout=20,
        ) as smtp_server:
            smtp_server.starttls()
            smtp_server.login(
                self.username,
                self.password,
            )
            smtp_server.send_message(message)

        return True