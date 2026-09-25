from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.models.ticket import DocumentationGuide, Ticket
from app.routers import dashboard, documentation, tickets
from app.services.seed import seed_database


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="Support Ticket Triage API",
    description="A small REST API for application-support ticket triage and resolution tracking.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(tickets.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(documentation.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "support-ticket-triage"}
