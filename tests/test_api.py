from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


def test_ticket_lifecycle_and_keyword_categorization():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as client:
        created = client.post("/api/tickets", json={
            "title": "Login failure after identity provider update",
            "description": "The support portal returns a login failure for the customer.",
            "category": "Other",
            "priority": "High",
            "assigned_to": "Maya Chen",
        })
        assert created.status_code == 201
        ticket = created.json()
        assert ticket["ticket_id"] == "TKT-0016"

        categorized = client.post("/api/tickets/categorize", json={
            "title": ticket["title"], "description": ticket["description"]
        })
        assert categorized.status_code == 200
        assert categorized.json()["category"] == "Authentication"
        assert categorized.json()["matched_rule"] == "login"

        note_update = client.put(f"/api/tickets/{ticket['id']}", json={
            "category": "Authentication",
            "status": "Investigating",
            "root_cause": "Expired SSO signing certificate.",
            "resolution": "Installed the renewed certificate and verified sign-in.",
            "add_note": "Checked authentication service logs; certificate mismatch confirmed.",
        })
        assert note_update.status_code == 200
        assert "certificate mismatch" in note_update.json()["investigation_notes"]
        assert note_update.json()["root_cause"] == "Expired SSO signing certificate."
        assert "verified sign-in" in note_update.json()["resolution"]

        resolved = client.patch(f"/api/tickets/{ticket['id']}/status", json={"status": "Resolved"})
        assert resolved.status_code == 200
        assert resolved.json()["resolution_at"] is not None
        assert resolved.json()["resolution_time_minutes"] is not None

        closed = client.patch(f"/api/tickets/{ticket['id']}/status", json={"status": "Closed"})
        assert closed.status_code == 200
        assert closed.json()["resolution_at"] is not None
        stats = client.get("/api/dashboard/stats").json()
        assert stats["total_tickets"] == 16
        assert stats["resolved_tickets"] == 6

        filtered = client.get("/api/tickets", params={
            "status": "Closed",
            "priority": "High",
            "category": "Authentication",
            "assigned_to": "Maya Chen",
        })
        assert filtered.status_code == 200
        assert filtered.json()["total"] == 1
        assert filtered.json()["items"][0]["ticket_id"] == "TKT-0016"


def test_troubleshooting_guides_are_available():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as client:
        guides = client.get("/api/documentation")
        assert guides.status_code == 200
        assert len(guides.json()) == 5
        assert client.get("/api/documentation/login-authentication").status_code == 200
