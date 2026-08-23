import pytest

from app.services.email_service import EmailService


def test_email_service_does_not_send_in_test_mode(
    monkeypatch,
    capsys,
):
    monkeypatch.setenv("SMTP_ENABLED", "false")
    service = EmailService()

    result = service.send_email(
        recipient="ahmet@example.com",
        subject="Test",
        body="Test mesajı",
    )

    assert result is False
    assert "e-posta gönderilmedi" in capsys.readouterr().out


def test_email_service_requires_credentials_when_enabled(monkeypatch):
    monkeypatch.setenv("SMTP_ENABLED", "true")
    monkeypatch.setenv("SMTP_USERNAME", "")
    monkeypatch.setenv("SMTP_PASSWORD", "")
    service = EmailService()

    with pytest.raises(RuntimeError, match="şifresi eksik"):
        service.send_email(
            recipient="ahmet@example.com",
            subject="Test",
            body="Test mesajı",
        )
