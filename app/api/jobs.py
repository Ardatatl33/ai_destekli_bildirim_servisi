from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import NotificationAgent, NotificationJob
from app.schemas import (
    NotificationJobCreate,
    NotificationJobResponse,
)


router = APIRouter(
    prefix="/notification-jobs",
    tags=["Bildirim İşleri"],
)


@router.post(
    "",
    response_model=NotificationJobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni bildirim işi oluştur",
)
def create_notification_job(
    job_data: NotificationJobCreate,
    db: Session = Depends(get_db),
):
    """Yeni bir notification job oluşturur."""

    agent = db.get(
        NotificationAgent,
        job_data.agent_id,
    )

    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Belirtilen bildirim agent'ı bulunamadı.",
        )

    job = NotificationJob(
        **job_data.model_dump(),
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


@router.get(
    "",
    response_model=list[NotificationJobResponse],
    summary="Bildirim işlerini listele",
)
def list_notification_jobs(
    db: Session = Depends(get_db),
):
    """Tüm notification job kayıtlarını listeler."""

    statement = select(NotificationJob).order_by(
        NotificationJob.id,
    )

    jobs = db.scalars(statement).all()

    return jobs