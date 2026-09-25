import { useMemo, useState } from "react";
import { ArrowDownUp, ListFilter, Plus, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { Category, Priority, Ticket, TicketStatus } from "../types";
import { CATEGORIES, PRIORITIES, STATUSES } from "../types";
import { PriorityBadge, StatusBadge } from "../components/Badge";

const ASSIGNEES = ["Maya Chen", "Jordan Lee", "Avery Patel", "Sam Rivera", "Unassigned"];
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }

export default function TicketsPage({ tickets, loading, onSelect, onCreate }: { tickets: Ticket[]; loading: boolean; onSelect: (ticket: Ticket) => void; onCreate: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [assignee, setAssignee] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const hasFilters = Boolean(search || status || priority || category || assignee);
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = tickets.filter((ticket) => (!term || `${ticket.ticket_id} ${ticket.title} ${ticket.description}`.toLowerCase().includes(term)) && (!status || ticket.status === status) && (!priority || ticket.priority === priority) && (!category || ticket.category === category) && (!assignee || ticket.assigned_to === assignee));
    return filtered.sort((a, b) => sortNewest ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [tickets, search, status, priority, category, assignee, sortNewest]);
  const reset = () => { setSearch(""); setStatus(""); setPriority(""); setCategory(""); setAssignee(""); };

  return <div className="page-content tickets-page">
    <div className="page-heading"><div><div className="overline">CASE MANAGEMENT</div><h1>Tickets</h1><p>Search, prioritize, and move support issues toward resolution.</p></div><button className="button button-primary" onClick={onCreate}><Plus size={17} /> New ticket</button></div>
    <section className="surface ticket-workspace">
      <div className="ticket-toolbar"><div className="search-field"><Search size={16} /><input aria-label="Search tickets" placeholder="Search by ID, title, or description…" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></div><span className="ticket-count">{visible.length} {visible.length === 1 ? "ticket" : "tickets"}</span><button className={`button button-quiet button-small filter-toggle ${hasFilters ? "has-active-filter" : ""}`} onClick={() => { document.querySelector(".filters-row")?.classList.toggle("filters-open"); }}><SlidersHorizontal size={15} /> Filters</button></div>
      <div className="filters-row filters-open"><label><span>Status</span><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as TicketStatus | "")}><option value="">All statuses</option>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Priority</span><select aria-label="Filter by priority" value={priority} onChange={(event) => setPriority(event.target.value as Priority | "")}><option value="">All priorities</option>{PRIORITIES.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Category</span><select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value as Category | "")}><option value="">All categories</option>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Assigned engineer</span><select aria-label="Filter by assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="">All engineers</option>{ASSIGNEES.map((value) => <option key={value}>{value}</option>)}</select></label>{hasFilters && <button className="reset-button" onClick={reset}><RotateCcw size={13} /> Reset filters</button>}</div>
      {loading ? <div className="table-loading">{[0, 1, 2, 3, 4].map((item) => <div className="table-skeleton" key={item} />)}</div> : visible.length ? <div className="table-scroll"><table className="ticket-table"><thead><tr><th><span>Ticket</span></th><th>Category</th><th>Priority</th><th>Status</th><th>Assignee</th><th><button className="sort-button" onClick={() => setSortNewest((value) => !value)}>Created <ArrowDownUp size={12} /></button></th></tr></thead><tbody>{visible.map((ticket) => <tr key={ticket.id} tabIndex={0} onClick={() => onSelect(ticket)} onKeyDown={(event) => { if (event.key === "Enter") onSelect(ticket); }}><td><span className={`table-mark mark-${ticket.priority.toLowerCase()}`} /><div className="table-ticket-title"><strong>{ticket.title}</strong><small className="mono">{ticket.ticket_id}</small></div></td><td><span className="category-cell"><i />{ticket.category}</span></td><td><PriorityBadge value={ticket.priority} /></td><td><StatusBadge value={ticket.status} /></td><td><span className="assignee-cell"><span className="avatar-chip">{ticket.assigned_to === "Unassigned" ? "—" : ticket.assigned_to.split(" ").map((word) => word[0]).join("")}</span>{ticket.assigned_to}</span></td><td className="date-cell">{formatDate(ticket.created_at)}</td></tr>)}</tbody></table></div> : <div className="empty-state ticket-empty"><div className="empty-icon"><ListFilter size={21} /></div><strong>{tickets.length ? "No tickets match these filters" : "Your queue is clear"}</strong><span>{tickets.length ? "Adjust your search or reset the filters to see more tickets." : "Create a ticket to start tracking support work."}</span>{tickets.length ? <button className="button button-soft" onClick={reset}>Reset filters</button> : <button className="button button-primary" onClick={onCreate}><Plus size={16} /> Create first ticket</button>}</div>}
    </section>
  </div>;
}
