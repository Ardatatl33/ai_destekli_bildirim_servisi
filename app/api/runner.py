from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import PendingJobsRunResponse
from app.services.ai_provider import OllamaProvider
from app.services.ai_service import NotificationAIService
from app.services.email_service import EmailService
from app.services.job_processor import NotificationJobProcessor


router = APIRouter(
    tags=["Bildirim İşlemleri"],
)


@router.post(
    "/run-pending-jobs",
    response_model=PendingJobsRunResponse,
    summary="Bekleyen bildirim işlerini çalıştır",
)
def run_pending_jobs(
    db: Session = Depends(get_db),
):
    """Bekleyen job kayıtlarını işler."""

    ai_provider = OllamaProvider()
    ai_service = NotificationAIService(
        provider=ai_provider,
    )

    email_service = EmailService()

    processor = NotificationJobProcessor(
        ai_service=ai_service,
        email_service=email_service,
    )

    result = processor.process_pending_jobs(db)

    return {
        "message": "Bekleyen bildirim işleri işlendi.",
        **result,
    }