import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import Modal from "./Modal";
import { api } from "../services/api";
import { CATEGORIES, PRIORITIES, type Category, type DocumentationGuide, type TicketPayload } from "../types";

const EMPTY: TicketPayload = { title: "", description: "", category: "Other", priority: "Medium", assigned_to: "Unassigned", documentation_link: "" };

export default function CreateTicketModal({ guides, onClose, onCreate }: { guides: DocumentationGuide[]; onClose: () => void; onCreate: (payload: TicketPayload) => Promise<void> }) {
  const [form, setForm] = useState<TicketPayload>(EMPTY);
  const [categorizing, setCategorizing] = useState(false);
  const [matchedRule, setMatchedRule] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof TicketPayload>(key: K, value: TicketPayload[K]) => setForm((previous) => ({ ...previous, [key]: value }));

  const autoCategorize = async () => {
    if (!form.title.trim() && !form.description.trim()) {
      setError("Add a title or description first, then try auto-categorize.");
      return;
    }
    setCategorizing(true);
    setError("");
    try {
      const result = await api.categorize(form.title, form.description);
      update("category", result.category as Category);
      setMatchedRule(result.matched_rule);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not categorize this ticket.");
    } finally {
      setCategorizing(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onCreate(form);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create ticket.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create a support ticket" description="Capture the report, triage it, and assign the next step." onClose={onClose} wide>
      <form className="ticket-form" onSubmit={submit}>
        <label className="field full-field"><span>Ticket title <b>*</b></span><input autoFocus value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Users can't sign in after SSO update" minLength={4} maxLength={180} required /></label>
        <label className="field full-field"><span>Description <b>*</b></span><textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="What is happening, who is affected, and what changed recently?" minLength={8} rows={4} required /></label>
        <div className="field full-field category-field">
          <label className="field"><span>Category</span><select value={form.category} onChange={(event) => update("category", event.target.value as Category)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          <div className="auto-categorize-wrap"><button type="button" className="button button-soft" onClick={autoCategorize} disabled={categorizing}>{categorizing ? <LoaderCircle size={15} className="spin" /> : <Sparkles size={15} />} Auto-categorize</button>{matchedRule && <span className="rule-hint">Matched “{matchedRule}”</span>}</div>
        </div>
        <label className="field"><span>Priority</span><select value={form.priority} onChange={(event) => update("priority", event.target.value as TicketPayload["priority"])}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
        <label className="field"><span>Assigned to</span><select value={form.assigned_to} onChange={(event) => update("assigned_to", event.target.value)}>{["Unassigned", "Maya Chen", "Jordan Lee", "Avery Patel", "Sam Rivera"].map((person) => <option key={person}>{person}</option>)}</select></label>
        <label className="field full-field"><span>Related troubleshooting guide</span><select value={form.documentation_link || ""} onChange={(event) => update("documentation_link", event.target.value || null)}><option value="">No guide linked</option>{guides.map((guide) => <option key={guide.id} value={guide.id}>{guide.title}</option>)}</select></label>
        {error && <div className="form-error full-field" role="alert">{error}</div>}
        <footer className="modal-actions full-field"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? <LoaderCircle size={16} className="spin" /> : <>Create ticket <ArrowRight size={16} /></>}</button></footer>
      </form>
    </Modal>
  );
}
