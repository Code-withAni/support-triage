from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, computed_field


class Category(str, Enum):
    application_error = "Application Error"
    authentication = "Authentication"
    database = "Database"
    network = "Network"
    performance = "Performance"
    access_permission = "Access / Permission"
    configuration = "Configuration"
    hardware = "Hardware"
    documentation = "Documentation"
    other = "Other"


class Priority(str, Enum):
    critical = "Critical"
    high = "High"
    medium = "Medium"
    low = "Low"


class Status(str, Enum):
    open = "Open"
    assigned = "Assigned"
    investigating = "Investigating"
    waiting_for_user = "Waiting for User"
    resolved = "Resolved"
    closed = "Closed"


class TicketCreate(BaseModel):
    title: str = Field(min_length=4, max_length=180)
    description: str = Field(min_length=8)
    category: Category = Category.other
    priority: Priority = Priority.medium
    status: Status = Status.open
    assigned_to: str = Field(default="Unassigned", max_length=100)
    investigation_notes: str = ""
    root_cause: str = ""
    resolution: str = ""
    documentation_link: str | None = None


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=4, max_length=180)
    description: str | None = Field(default=None, min_length=8)
    category: Category | None = None
    priority: Priority | None = None
    status: Status | None = None
    assigned_to: str | None = Field(default=None, max_length=100)
    investigation_notes: str | None = None
    add_note: str | None = Field(default=None, min_length=1)
    root_cause: str | None = None
    resolution: str | None = None
    documentation_link: str | None = None


class TicketStatusUpdate(BaseModel):
    status: Status


class CategorizeRequest(BaseModel):
    title: str = ""
    description: str = ""


class CategorizeResponse(BaseModel):
    category: Category
    matched_rule: str


class TicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    assigned_to: str
    created_at: datetime
    updated_at: datetime
    investigation_notes: str
    root_cause: str
    resolution: str
    documentation_link: str | None
    resolution_at: datetime | None

    @computed_field
    @property
    def resolution_time_minutes(self) -> float | None:
        if not self.resolution_at:
            return None
        return round((self.resolution_at - self.created_at).total_seconds() / 60, 1)


class TicketList(BaseModel):
    items: list[TicketRead]
    total: int


class DistributionItem(BaseModel):
    label: str
    count: int


class DashboardStats(BaseModel):
    total_tickets: int
    open_tickets: int
    high_critical_tickets: int
    resolved_tickets: int
    average_resolution_minutes: float | None
    category_distribution: list[DistributionItem]
    status_distribution: list[DistributionItem]
    recent_tickets: list[TicketRead]


class DocumentationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    category: str
    symptoms: str
    possible_causes: str
    troubleshooting_steps: str
    resolution: str
