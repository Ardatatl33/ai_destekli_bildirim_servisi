import pytest
from pydantic import ValidationError

from app.schemas import NotificationAgentCreate, NotificationJobCreate


def test_agent_schema_accepts_email_channel():
    agent = NotificationAgentCreate(
        name="Kargo Agent",
        channel="email",
        prompt="Kısa kargo bildirimi hazırla.",
    )

    assert agent.channel == "email"
    assert agent.is_active is True


def test_agent_schema_rejects_unknown_channel():
    with pytest.raises(ValidationError):
        NotificationAgentCreate(
            name="Geçersiz Agent",
            channel="sms",
            prompt="Test",
        )


def test_job_schema_rejects_non_positive_agent_id():
    with pytest.raises(ValidationError):
        NotificationJobCreate(
            agent_id=0,
            recipient="ahmet@example.com",
            subject="Test bildirimi",
            input_data={"status": "Kargoya verildi"},
        )

