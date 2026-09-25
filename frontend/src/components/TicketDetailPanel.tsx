import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, BookOpen, CalendarDays, Check, Clock3, FileText, MessageSquareText, Pencil, Save, Send, X } from "lucide-react";
import { PRIORITIES, STATUSES, type DocumentationGuide, type Ticket, type TicketPayload, type TicketStatus } from "../types";
import { PriorityBadge, StatusBadge } from "./Badge";

const STEPS: TicketStatus[] = ["Open", "Assigned", "Investigating", "Waiting for User", "Resolved", "Closed"];
const PEOPLE = ["Unassigned", "Maya Chen", "Jordan Lee", "Avery Patel", "Sam Rivera"];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDuration(minutes: number | null | undefined) {
  if (minutes == null) return "Not resolved yet";
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return days ? `${days}d ${hours % 24}h` : `${hours}h ${Math.round(minutes % 60)}m`;
}

type Editable = Pick<TicketPayload, "title" | "description" | "category" | "priority" | "assigned_to" | "root_cause" | "resolution" | "documentation_link">;
function fromTicket(ticket: Ticket): Editable {
  return { title: ticket.title, description: ticket.description, category: ticket.category, priority: ticket.priority, assigned_to: ticket.assigned_to, root_cause: ticket.root_cause, resolution: ticket.resolution, documentation_link: ticket.documentation_link };
}

export default function TicketDetailPanel({ ticket, guides, onClose, onUpdate, onStatusChange, onOpenGuide, notify }: {
  ticket: Ticket;
  guides: DocumentationGuide[];
  onClose: () => void;
  onUpdate: (id: number, payload: Partial<TicketPayload> & { add_note?: string }) => Promise<Ticket>;
  onStatusChange: (id: number, status: TicketStatus) => Promise<Ticket>;
  onOpenGuide: () => void;
  notify: (message: string, kind?: "success" | "error") => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Editable>(() => fromTicket(ticket));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setDraft(fromTicket(ticket)); setEditing(false); setError(""); }, [ticket.id]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const updateDraft = <K extends keyof Editable>(key: K, value: Editable[K]) => setDraft((old) => ({ ...old, [key]: value }));
  const saveDetails = async () => {
    setSaving(true); setError("");
    try {
      await onUpdate(ticket.id, draft);
      setEditing(false);
      notify("Ticket details saved.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save ticket details.";
      setError(message); notify(message, "error");
    } finally { setSaving(false); }
  };

  const changeStatus = async (next: TicketStatus) => {
    setStatusBusy(true);
    try {
      await onStatusChange(ticket.id, next);
      notify(next === "Resolved" || next === "Closed" ? `Ticket marked ${next.toLowerCase()}. Resolution time recorded.` : `Status updated to ${next}.`);
    } catch (cause) { notify(cause instanceof Error ? cause.message : "Status update failed.", "error"); }
    finally { setStatusBusy(false); }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await onUpdate(ticket.id, { add_note: note.trim() });
      setNote("");
      notify("Investigation note added.");
    } catch (cause) { notify(cause instanceof Error ? cause.message : "Could not add note.", "error"); }
  };

  const guide = guides.find((item) => item.id === ticket.documentation_link);
  const activeStep = STEPS.indexOf(ticket.status);
  const notes = ticket.investigation_notes.split("\n").map((item) => item.trim()).filter(Boolean);

  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="detail-panel" role="dialog" aria-modal="true" aria-label={`Ticket ${ticket.ticket_id} details`}>
        <header className="detail-topbar">
          <div className="detail-id"><button className="back-button" onClick={onClose}><X size={18} /></button><span className="mono">{ticket.ticket_id}</span><span className="detail-dot" /> <span>Support ticket</span></div>
          <div className="detail-top-actions"><button className="button button-quiet button-small" onClick={() => setEditing((value) => !value)}>{editing ? <X size={15} /> : <Pencil size={15} />}{editing ? "Cancel edit" : "Edit"}</button></div>
        </header>
        <div className="detail-scroll">
          <div className="detail-title-block">
            {editing ? <input className="detail-title-input" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} /> : <h1>{ticket.title}</h1>}
            <div className="detail-badge-row"><PriorityBadge value={ticket.priority} /> <label className="status-select-wrap"><span className="sr-only">Update ticket status</span><select aria-label="Update ticket status" value={ticket.status} disabled={statusBusy} onChange={(event) => changeStatus(event.target.value as TicketStatus)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label></div>
          </div>
          <section className="lifecycle-card">
            <div className="section-eyebrow"><Activity size={14} /> LIFECYCLE</div>
            <div className="lifecycle-track">{STEPS.map((step, index) => <div key={step} className={`lifecycle-step ${index <= activeStep ? "is-done" : ""} ${step === ticket.status ? "is-current" : ""}`}><span className="lifecycle-node">{index < activeStep ? <Check size={11} /> : index + 1}</span><span>{step}</span></div>)}</div>
          </section>
          <div className="detail-meta-grid">
            <div className="meta-cell"><span>ASSIGNEE</span>{editing ? <select value={draft.assigned_to} onChange={(event) => updateDraft("assigned_to", event.target.value)}>{PEOPLE.map((person) => <option key={person}>{person}</option>)}</select> : <strong>{ticket.assigned_to}</strong>}</div>
            <div className="meta-cell"><span>CATEGORY</span>{editing ? <select value={draft.category} onChange={(event) => updateDraft("category", event.target.value as TicketPayload["category"])}>{["Application Error", "Authentication", "Database", "Network", "Performance", "Access / Permission", "Configuration", "Hardware", "Documentation", "Other"].map((category) => <option key={category}>{category}</option>)}</select> : <strong>{ticket.category}</strong>}</div>
            {editing && <div className="meta-cell"><span>PRIORITY</span><select value={draft.priority} onChange={(event) => updateDraft("priority", event.target.value as TicketPayload["priority"])}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></div>}
            <div className="meta-cell"><span>CREATED</span><strong><CalendarDays size={13} />{formatDate(ticket.created_at)}</strong></div>
            <div className="meta-cell"><span>LAST UPDATED</span><strong><Clock3 size={13} />{formatDate(ticket.updated_at)}</strong></div>
          </div>
          <section className="detail-section">
            <h2><FileText size={15} /> Description</h2>
            {editing ? <textarea className="detail-textarea" rows={4} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /> : <p className="detail-copy">{ticket.description}</p>}
          </section>
          <section className="detail-section split-info">
            <div><h2>Root cause</h2>{editing ? <textarea className="detail-textarea" rows={3} placeholder="What caused the issue?" value={draft.root_cause || ""} onChange={(event) => updateDraft("root_cause", event.target.value)} /> : <p className={ticket.root_cause ? "detail-copy" : "empty-copy"}>{ticket.root_cause || "Add a finding after investigation."}</p>}</div>
            <div><h2>Resolution</h2>{editing ? <textarea className="detail-textarea" rows={3} placeholder="What fixed the issue?" value={draft.resolution || ""} onChange={(event) => updateDraft("resolution", event.target.value)} /> : <p className={ticket.resolution ? "detail-copy" : "empty-copy"}>{ticket.resolution || "Record the fix when the ticket is resolved."}</p>}</div>
          </section>
          {editing && <section className="detail-section"><h2>Linked documentation</h2><select className="wide-select" value={draft.documentation_link || ""} onChange={(event) => updateDraft("documentation_link", event.target.value || null)}><option value="">No guide linked</option>{guides.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></section>}
          {!editing && guide && <button className="linked-guide" onClick={onOpenGuide}><span className="guide-icon"><BookOpen size={17} /></span><span><small>LINKED TROUBLESHOOTING GUIDE</small><strong>{guide.title}</strong></span><ArrowUpRight size={15} /></button>}
          {!editing && !guide && <button className="linked-guide guide-empty" onClick={onOpenGuide}><span className="guide-icon"><BookOpen size={17} /></span><span><small>DOCUMENTATION</small><strong>Browse troubleshooting guides</strong></span><ArrowUpRight size={15} /></button>}
          <section className="detail-section notes-section">
            <div className="section-heading-row"><h2><MessageSquareText size={15} /> Investigation notes <span className="note-count">{notes.length}</span></h2></div>
            {notes.length ? <div className="note-list">{notes.map((item, index) => <div className="note-entry" key={`${index}-${item}`}><span className="note-avatar">{ticket.assigned_to === "Unassigned" ? "S" : ticket.assigned_to.split(" ").map((word) => word[0]).join("")}</span><p>{item}</p></div>)}</div> : <p className="empty-copy notes-empty">No investigation notes yet. Add the first finding below.</p>}
            <div className="note-composer"><textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add an investigation finding…" onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void addNote(); }} /><button aria-label="Add investigation note" className="send-note" onClick={() => void addNote()} disabled={!note.trim()}><Send size={15} /></button></div>
          </section>
          <section className="resolution-summary"><span><Clock3 size={16} /> Resolution time</span><strong>{formatDuration(ticket.resolution_time_minutes)}</strong><small>{ticket.resolution_at ? `Resolved ${formatDate(ticket.resolution_at)}` : "Timer is recorded when marked resolved."}</small></section>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        {editing && <footer className="detail-footer"><button className="button button-quiet" onClick={() => { setEditing(false); setDraft(fromTicket(ticket)); }}>Discard</button><button className="button button-primary" onClick={() => void saveDetails()} disabled={saving}>{saving ? "Saving…" : <><Save size={15} /> Save changes</>}</button></footer>}
      </aside>
    </div>
  );
}
