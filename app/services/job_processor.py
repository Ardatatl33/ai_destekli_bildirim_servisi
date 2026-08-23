from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import NotificationAgent, NotificationJob
from app.services.ai_service import NotificationAIService
from app.services.email_service import EmailService

import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class NotificationJobProcessor:
    """Bekleyen notification job kayıtlarını işler."""

    def __init__(
        self,
        ai_service: NotificationAIService,
        email_service: EmailService,
    ):
        self.ai_service = ai_service
        self.email_service = email_service

    def process_pending_jobs(
        self,
        db: Session,
    ) -> dict[str, int]:
        """Tüm pending job kayıtlarını işler."""

        statement = (
            select(NotificationJob)
            .where(NotificationJob.status == "pending")
            .order_by(NotificationJob.id)
        )

        pending_jobs = db.scalars(statement).all()

        logger.info(
            "İşlenecek bekleyen job sayısı: %d",
            len(pending_jobs),
        )

        sent_count = 0
        failed_count = 0

        for job in pending_jobs:
            logger.info(
                "Job işleniyor: id=%d, agent_id=%d",
                job.id,
                job.agent_id,
            )
            try:
                job.status = "processing"
                db.commit()

                agent = db.get(
                    NotificationAgent,
                    job.agent_id,
                )

                if agent is None:
                    raise RuntimeError(
                        "Job için bildirim agent'ı bulunamadı."
                    )

                ai_output = self.ai_service.generate_message(
                    agent_prompt=agent.prompt,
                    input_data=job.input_data,
                )

                job.ai_output = ai_output
                db.commit()

                if agent.channel == "email":
                    email_sent = self.email_service.send_email(
                        recipient=job.recipient,
                        subject=job.subject,
                        body=ai_output,
                    )

                    if not email_sent:
                        raise RuntimeError(
                            "SMTP test modu aktif; "
                            "e-posta gönderilmedi."
                        )

                elif agent.channel == "system":
                    # Sistem bildirimi için şimdilik AI çıktısını kaydediyoruz.
                    pass

                else:
                    raise RuntimeError(
                        f"Desteklenmeyen kanal: {agent.channel}"
                    )

                job.status = "sent"
                job.sent_at = datetime.now(timezone.utc)
                job.error_message = None

                db.commit()
                sent_count += 1
                logger.info(
                    "Job başarıyla tamamlandı: id=%d",
                    job.id,
                )

            except Exception as error:
                db.rollback()

                failed_job = db.get(
                    NotificationJob,
                    job.id,
                )

                if failed_job is not None:
                    failed_job.status = "failed"
                    failed_job.error_message = str(error)
                    db.commit()

                failed_count += 1
                logger.error(
                    "Job başarısız oldu: id=%d, hata=%s",
                    job.id,
                    error,
                )

        return {
            "processed_count": len(pending_jobs),
            "sent_count": sent_count,
            "failed_count": failed_count,
        }
