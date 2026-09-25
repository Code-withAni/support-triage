from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import Ticket
from app.schemas.ticket import DashboardStats

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    total = db.scalar(select(func.count()).select_from(Ticket)) or 0
    open_count = db.scalar(select(func.count()).select_from(Ticket).where(Ticket.status.notin_(["Resolved", "Closed"]))) or 0
    priority_count = db.scalar(select(func.count()).select_from(Ticket).where(Ticket.priority.in_(["High", "Critical"]))) or 0
    resolved_count = db.scalar(select(func.count()).select_from(Ticket).where(Ticket.status.in_(["Resolved", "Closed"]))) or 0

    resolved_rows = db.execute(
        select(Ticket.created_at, Ticket.resolution_at)
        .where(Ticket.resolution_at.is_not(None))
    ).all()
    resolution_minutes: list[float] = []
    for created_at, resolution_at in resolved_rows:
        start = created_at.replace(tzinfo=timezone.utc) if created_at.tzinfo is None else created_at
        end = resolution_at.replace(tzinfo=timezone.utc) if resolution_at.tzinfo is None else resolution_at
        resolution_minutes.append((end - start).total_seconds() / 60)
    avg_minutes = round(sum(resolution_minutes) / len(resolution_minutes), 1) if resolution_minutes else None

    category_counts = db.execute(select(Ticket.category, func.count()).group_by(Ticket.category).order_by(func.count().desc())).all()
    status_counts = db.execute(select(Ticket.status, func.count()).group_by(Ticket.status).order_by(func.count().desc())).all()
    recent = list(db.scalars(select(Ticket).order_by(Ticket.created_at.desc(), Ticket.id.desc()).limit(6)).all())
    return {
        "total_tickets": total,
        "open_tickets": open_count,
        "high_critical_tickets": priority_count,
        "resolved_tickets": resolved_count,
        "average_resolution_minutes": avg_minutes,
        "category_distribution": [{"label": label, "count": count} for label, count in category_counts],
        "status_distribution": [{"label": label, "count": count} for label, count in status_counts],
        "recent_tickets": recent,
    }
