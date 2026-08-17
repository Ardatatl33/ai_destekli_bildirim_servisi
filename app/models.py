from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class NotificationAgent(Base):
  """AI destekli bildirim üretim kurallarını temsil eder."""

  __tablename__ = "notification_agents"

  id: Mapped[int] = mapped_column(
    primary_key=True
  )

  name: Mapped[str] = mapped_column(
    String(100),
    nullable=False
  )

  channel: Mapped[str] = mapped_column(
      String(20),
      nullable=False,
  )

  prompt: Mapped[str] = mapped_column(
      Text,
      nullable=False,
  )

  is_active: Mapped[bool] = mapped_column(
      Boolean,
      default=True,
      nullable=False,
  )

  jobs: Mapped[list["NotificationJob"]] = relationship(
      back_populates="agent",
  )


class NotificationJob(Base):
    """Üretilecek veya üretilmiş tek bir bildirimi temsil eder."""

    __tablename__ = "notification_jobs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    agent_id: Mapped[int] = mapped_column(
        ForeignKey("notification_agents.id"),
        nullable=False,
    )

    recipient: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
    )

    subject: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    input_data: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        server_default="pending",
        nullable=False,
    )

    ai_output: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    agent: Mapped["NotificationAgent"] = relationship(
        back_populates="jobs",
    )