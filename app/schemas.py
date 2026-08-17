from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class NotificationAgentCreate(BaseModel):
    """Yeni notification agent oluşturma isteği."""

    name: str = Field(
        min_length=1,
        max_length=100,
        description="Agent adı",
    )

    channel: Literal["email", "system"] = Field(
        description="Bildirim kanalı",
    )

    prompt: str = Field(
        min_length=1,
        description="AI agent prompt'u",
    )

    is_active: bool = Field(
        default=True,
        description="Agent aktif mi?",
    )


class NotificationAgentResponse(BaseModel):
    """API'den dönecek notification agent verisi."""

    id: int
    name: str
    channel: Literal["email", "system"]
    prompt: str
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


class NotificationJobCreate(BaseModel):
    """Yeni notification job oluşturma isteği."""

    agent_id: int = Field(
        gt=0,
        description="Job'ı işleyecek agent kimliği",
    )

    recipient: str = Field(
        min_length=1,
        max_length=320,
        description="Bildirim alıcısı",
    )

    subject: str = Field(
        min_length=1,
        max_length=255,
        description="Bildirim konusu",
    )

    input_data: dict[str, Any] = Field(
        description="AI'ya gönderilecek giriş verileri",
    )


class NotificationJobResponse(BaseModel):
    """API'den dönecek notification job verisi."""

    id: int
    agent_id: int
    recipient: str
    subject: str
    input_data: dict[str, Any]
    status: Literal["pending", "processing", "sent", "failed"]
    ai_output: str | None
    error_message: str | None
    created_at: datetime
    sent_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True,
    )