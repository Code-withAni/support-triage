from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import Ticket
from app.schemas.ticket import (
    CategorizeRequest,
    CategorizeResponse,
    Category,
    Status,
    TicketCreate,
    TicketList,
    TicketRead,
    TicketStatusUpdate,
    TicketUpdate,
)
from app.services.categorization import categorize_text

router = APIRouter(tags=["tickets"])


def _ticket_or_404(db: Session, ticket_id: int) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


def _next_ticket_id(db: Session) -> str:
    current_max = db.scalar(select(func.max(Ticket.ticket_id)))
    if not current_max:
        return "TKT-0001"
    return f"TKT-{int(current_max.split('-')[-1]) + 1:04d}"


def _set_status(ticket: Ticket, next_status: str) -> None:
    ticket.status = next_status
    now = datetime.now(timezone.utc)
    ticket.updated_at = now
    if next_status in (Status.resolved.value, Status.closed.value):
        ticket.resolution_at = ticket.resolution_at or now
    else:
        ticket.resolution_at = None


@router.get("/tickets", response_model=TicketList)
def list_tickets(
    q: str | None = Query(default=None, description="Search ticket ID, title, and description"),
    status_filter: str | None = Query(default=None, alias="status"),
    priority: str | None = None,
    category: str | None = None,
    assigned_to: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(Ticket)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.where((Ticket.ticket_id.ilike(term)) | (Ticket.title.ilike(term)) | (Ticket.description.ilike(term)))
    if status_filter:
        query = query.where(Ticket.status == status_filter)
    if priority:
        query = query.where(Ticket.priority == priority)
    if category:
        query = query.where(Ticket.category == category)
    if assigned_to:
        query = query.where(Ticket.assigned_to == assigned_to)
    query = query.order_by(Ticket.created_at.desc(), Ticket.id.desc())
    items = list(db.scalars(query).all())
    return {"items": items, "total": len(items)}


@router.post("/tickets", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(mode="json")
    ticket_status = data.pop("status")
    ticket = Ticket(ticket_id=_next_ticket_id(db), status=ticket_status, **data)
    if ticket_status != Status.open.value:
        _set_status(ticket, ticket_status)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/tickets/{ticket_id}", response_model=TicketRead)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    return _ticket_or_404(db, ticket_id)


@router.put("/tickets/{ticket_id}", response_model=TicketRead)
def update_ticket(ticket_id: int, payload: TicketUpdate, db: Session = Depends(get_db)):
    ticket = _ticket_or_404(db, ticket_id)
    data = payload.model_dump(exclude_unset=True, mode="json")
    added_note = data.pop("add_note", None)
    next_status = data.pop("status", None)
    for field, value in data.items():
        setattr(ticket, field, value)
    if added_note:
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        ticket.investigation_notes = f"[{stamp}] {added_note.strip()}\n" + ticket.investigation_notes
    if next_status is not None:
        _set_status(ticket, next_status)
    else:
        ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.patch("/tickets/{ticket_id}/status", response_model=TicketRead)
def update_ticket_status(ticket_id: int, payload: TicketStatusUpdate, db: Session = Depends(get_db)):
    ticket = _ticket_or_404(db, ticket_id)
    _set_status(ticket, payload.status.value)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/tickets/categorize", response_model=CategorizeResponse)
def categorize_ticket(payload: CategorizeRequest):
    category, matched_rule = categorize_text(payload.title, payload.description)
    return {"category": category, "matched_rule": matched_rule}


@router.post("/tickets/{ticket_id}/categorize", response_model=CategorizeResponse)
def categorize_existing_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = _ticket_or_404(db, ticket_id)
    category, matched_rule = categorize_text(ticket.title, ticket.description)
    ticket.category = category.value
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"category": category, "matched_rule": matched_rule}


@router.delete("/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = _ticket_or_404(db, ticket_id)
    db.delete(ticket)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
