from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import NotificationAgent
from app.schemas import (
    NotificationAgentCreate,
    NotificationAgentResponse,
)


router = APIRouter(
    prefix="/agents",
    tags=["Bildirim Agent'ları"],
)


@router.post(
    "",
    response_model=NotificationAgentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni bildirim agent'ı oluştur",
)
def create_agent(
    agent_data: NotificationAgentCreate,
    db: Session = Depends(get_db),
):
    """Yeni bir notification agent oluşturur."""

    agent = NotificationAgent(
        **agent_data.model_dump(),
    )

    db.add(agent)
    db.commit()
    db.refresh(agent)

    return agent


@router.get(
    "",
    response_model=list[NotificationAgentResponse],
    summary="Bildirim agent'larını listele",
)
def list_agents(
    db: Session = Depends(get_db),
):
    """Tüm notification agent kayıtlarını listeler."""

    statement = select(NotificationAgent).order_by(
        NotificationAgent.id,
    )

    agents = db.scalars(statement).all()

    return agents