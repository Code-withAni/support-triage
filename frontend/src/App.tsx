import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Bell, BookOpen, ChevronDown, Command, Grid2X2, LifeBuoy, Menu, Plus, TicketCheck, X } from "lucide-react";
import CreateTicketModal from "./components/CreateTicketModal";
import TicketDetailPanel from "./components/TicketDetailPanel";
import DashboardPage from "./pages/DashboardPage";
import TicketsPage from "./pages/TicketsPage";
import DocsPage from "./pages/DocsPage";
import { api } from "./services/api";
import type { DashboardStats, DocumentationGuide, Ticket, TicketPayload, TicketStatus } from "./types";

 type View = "dashboard" | "tickets" | "documentation";
type Toast = { id: number; message: string; kind: "success" | "error" };

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [guides, setGuides] = useState<DocumentationGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [guideFocus, setGuideFocus] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  const notify = useCallback((message: string, kind: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((previous) => [...previous.slice(-2), { id, message, kind }]);
    window.setTimeout(() => setToasts((previous) => previous.filter((toast) => toast.id !== id)), 3400);
  }, []);

  const loadData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError("");
    try {
      const [ticketData, dashboardData, guideData] = await Promise.all([api.tickets(), api.dashboard(), api.documentation()]);
      setTickets(ticketData.items);
      setStats(dashboardData);
      setGuides(guideData);
      setApiHealthy(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The API could not be reached.";
      setError(message);
      setApiHealthy(false);
      if (!initial) notify(message, "error");
    } finally { if (initial) setLoading(false); }
  }, [notify]);

  useEffect(() => { void loadData(true); }, [loadData]);
  useEffect(() => {
    const onToast = (event: Event) => { const custom = event as CustomEvent<string>; notify(custom.detail); };
    window.addEventListener("relay:toast", onToast);
    return () => window.removeEventListener("relay:toast", onToast);
  }, [notify]);

  const updateLocalTicket = useCallback((ticket: Ticket) => {
    setTickets((current) => current.map((item) => item.id === ticket.id ? ticket : item));
    setSelectedTicket((current) => current?.id === ticket.id ? ticket : current);
  }, []);

  const createTicket = async (payload: TicketPayload) => {
    await api.createTicket(payload);
    setCreateOpen(false);
    setView("tickets");
    await loadData(false);
    notify("Ticket created and added to the queue.");
  };

  const updateTicket = async (id: number, payload: Partial<TicketPayload> & { add_note?: string }) => {
    const updated = await api.updateTicket(id, payload);
    updateLocalTicket(updated);
    const latest = await api.dashboard();
    setStats(latest);
    return updated;
  };

  const updateStatus = async (id: number, status: TicketStatus) => {
    const updated = await api.updateStatus(id, status);
    updateLocalTicket(updated);
    const latest = await api.dashboard();
    setStats(latest);
    return updated;
  };

  const selectView = (next: View) => { setView(next); setMobileNav(false); if (next !== "documentation") setGuideFocus(""); };
  const openGuide = () => { setSelectedTicket(null); setView("documentation"); setGuideFocus(selectedTicket?.documentation_link || ""); };
  const navItems = useMemo(() => [
    { id: "dashboard" as View, label: "Dashboard", icon: Grid2X2 },
    { id: "tickets" as View, label: "Tickets", icon: TicketCheck },
    { id: "documentation" as View, label: "Documentation", icon: BookOpen },
  ], []);
  const heading = view === "dashboard" ? "Dashboard" : view === "tickets" ? "Tickets" : "Documentation";

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
      <div className="brand"><span className="brand-mark"><Activity size={19} strokeWidth={2.5} /></span><span className="brand-wordmark">relay<em>desk</em></span></div>
      <button className="workspace-switcher"><span className="workspace-avatar">N</span><span className="workspace-copy"><strong>Northstar Systems</strong><small>Support workspace</small></span><ChevronDown className="workspace-chevron" size={15} /></button>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => selectView(item.id)}><Icon size={16} strokeWidth={1.9} /><span>{item.label}</span>{item.id === "tickets" && <span className="nav-count">{tickets.length}</span>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><div className="sidebar-note-top"><Activity size={13} /> TRIAGE TIP</div><p>Clear notes today save the next person an hour tomorrow.</p></div><div className="sidebar-profile"><span className="profile-avatar">MC</span><span className="profile-copy"><strong>Maya Chen</strong><small>Application Support</small></span><span className="profile-online" /></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label={mobileNav ? "Close navigation" : "Open navigation"} onClick={() => setMobileNav((value) => !value)}>{mobileNav ? <X size={18} /> : <Menu size={18} />}</button><div className="breadcrumb"><span>Workspace</span><ChevronDown size={12} className="crumb-chevron" style={{ transform: "rotate(-90deg)" }} /><strong>{heading}</strong></div><div className="topbar-actions"><span className="health-chip"><i style={{ background: apiHealthy === false ? "#c9695b" : apiHealthy === null ? "#c4a061" : "" }} />{apiHealthy === null ? "Connecting" : apiHealthy ? "API connected" : "API unavailable"}</span><button className="icon-button" title="Keyboard shortcuts" onClick={() => notify("Search tickets with the search box; Esc closes an open ticket.")}><Command size={16} /></button><span className="topbar-divider" /><button className="icon-button" title="Notifications" onClick={() => notify("You’re all caught up on notifications.")}><Bell size={16} /></button><span className="profile-mini">MC</span></div></header>
      {error && <div className="global-error" role="alert"><span><Activity size={15} /> {error}</span><button className="button button-quiet button-small" onClick={() => void loadData(true)}>Retry</button></div>}
      {view === "dashboard" && <DashboardPage stats={stats} tickets={stats?.recent_tickets ?? tickets} loading={loading} onSelect={setSelectedTicket} onViewAll={() => selectView("tickets")} />}
      {view === "tickets" && <TicketsPage tickets={tickets} loading={loading} onSelect={setSelectedTicket} onCreate={() => setCreateOpen(true)} />}
      {view === "documentation" && <DocsPage guides={guides} loading={loading} initialGuideId={guideFocus} />}
      <button className="quick-create" aria-label="Create new ticket" title="Create new ticket" onClick={() => setCreateOpen(true)}><Plus size={19} /></button>
    </main>
    {createOpen && <CreateTicketModal guides={guides} onClose={() => setCreateOpen(false)} onCreate={createTicket} />}
    {selectedTicket && <TicketDetailPanel ticket={selectedTicket} guides={guides} onClose={() => setSelectedTicket(null)} onUpdate={updateTicket} onStatusChange={updateStatus} onOpenGuide={openGuide} notify={notify} />}
    <div className="toast-region" aria-live="polite" aria-relevant="additions">{toasts.map((toast) => <div className={`toast ${toast.kind === "error" ? "toast-error" : ""}`} key={toast.id}><Activity size={15} />{toast.message}</div>)}</div>
  </div>;
}
