import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock3, LifeBuoy, TrendingUp } from "lucide-react";
import type { DashboardStats, Ticket } from "../types";
import { PriorityBadge, StatusBadge } from "../components/Badge";

const COLORS: Record<string, string> = { "Application Error": "#d97753", Authentication: "#8b6bb0", Database: "#5378a5", Network: "#4a9b9c", Performance: "#c3923d", "Access / Permission": "#78955d", Configuration: "#727f94", Hardware: "#b16f85", Documentation: "#658a72", Other: "#8994a3" };
const STATUS_COLORS: Record<string, string> = { Open: "#d99a43", Assigned: "#6884a7", Investigating: "#6a72ad", "Waiting for User": "#b07b4f", Resolved: "#429279", Closed: "#82918e" };

function formatWhen(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function duration(minutes: number | null) {
  if (minutes === null) return "—";
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  const hours = Math.floor(minutes / 60);
  return hours > 24 ? `${Math.floor(hours / 24)}d ${Math.floor((hours % 24))}h` : `${hours}h ${Math.round(minutes % 60)}m`;
}

function MetricCard({ label, value, icon: Icon, note, tone, index }: { label: string; value: string | number; icon: typeof LifeBuoy; note: string; tone: string; index: number }) {
  return <article className={`metric-card metric-${tone}`} style={{ animationDelay: `${index * 55}ms` }}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17} strokeWidth={1.8} /></span></div><strong className="metric-number">{value}</strong><small>{note}</small></article>;
}

export default function DashboardPage({ stats, tickets, loading, onSelect, onViewAll }: { stats: DashboardStats | null; tickets: Ticket[]; loading: boolean; onSelect: (ticket: Ticket) => void; onViewAll: () => void }) {
  const maxCategory = Math.max(1, ...(stats?.category_distribution ?? []).map((item) => item.count));
  const totalStatus = Math.max(1, (stats?.status_distribution ?? []).reduce((sum, item) => sum + item.count, 0));
  if (loading && !stats) return <div className="page-content"><div className="page-heading"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" /></div><div className="metric-grid">{[0, 1, 2, 3, 4].map((item) => <div className="skeleton metric-skeleton" key={item} />)}</div><div className="skeleton dashboard-skeleton" /></div>;

  return <div className="page-content dashboard-page">
    <div className="page-heading"><div><div className="overline">SUPPORT OPERATIONS <span className="live-dot" /> LIVE DATA</div><h1>Good morning, team.</h1><p>Your queue at a glance — here’s what needs attention today.</p></div><div className="heading-date"><span className="today-dot" /> {new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</div></div>
    <div className="metric-grid">
      <MetricCard label="Total tickets" value={stats?.total_tickets ?? 0} icon={LifeBuoy} note="Across all support queues" tone="slate" index={0} />
      <MetricCard label="Open queue" value={stats?.open_tickets ?? 0} icon={Activity} note="Awaiting final resolution" tone="blue" index={1} />
      <MetricCard label="High / critical" value={stats?.high_critical_tickets ?? 0} icon={AlertTriangle} note="Prioritized for response" tone="amber" index={2} />
      <MetricCard label="Resolved" value={stats?.resolved_tickets ?? 0} icon={CheckCircle2} note="Resolved and closed" tone="green" index={3} />
      <MetricCard label="Avg. resolution" value={duration(stats?.average_resolution_minutes ?? null)} icon={Clock3} note="Resolved ticket average" tone="violet" index={4} />
    </div>
    <div className="dashboard-grid">
      <section className="surface recent-surface">
        <div className="surface-heading"><div><span className="overline">IN THE QUEUE</span><h2>Recent tickets</h2></div><button className="text-link" onClick={onViewAll}>View all tickets <ArrowRight size={14} /></button></div>
        <div className="recent-list">{tickets.slice(0, 6).map((ticket) => <button className="recent-row" key={ticket.id} onClick={() => onSelect(ticket)}><div className="recent-title"><span className={`ticket-mark mark-${ticket.priority.toLowerCase()}`}><LifeBuoy size={15} /></span><span className="recent-copy"><strong>{ticket.title}</strong><small><span className="mono">{ticket.ticket_id}</span><i />{ticket.category}</small></span></div><div className="recent-meta"><PriorityBadge value={ticket.priority} /><StatusBadge value={ticket.status} /><small>{formatWhen(ticket.created_at)}</small></div></button>)}{tickets.length === 0 && <div className="empty-state"><div className="empty-icon"><LifeBuoy size={22} /></div><strong>No tickets yet</strong><span>Create a ticket to start your queue.</span></div>}</div>
      </section>
      <div className="side-analytics">
        <section className="surface distribution-surface"><div className="surface-heading"><div><span className="overline">TICKET MIX</span><h2>By category</h2></div><span className="subtle-count">{stats?.total_tickets ?? 0} total</span></div><div className="category-bars">{stats?.category_distribution.length ? stats.category_distribution.slice(0, 6).map((item) => <div className="category-bar-row" key={item.label}><div><span className="category-dot" style={{ background: COLORS[item.label] ?? COLORS.Other }} /><span>{item.label}</span><b>{item.count}</b></div><div className="bar-track"><span style={{ width: `${Math.max(7, item.count / maxCategory * 100)}%`, background: COLORS[item.label] ?? COLORS.Other }} /></div></div>) : <div className="empty-inline">Category counts will appear here.</div>}</div></section>
        <section className="surface status-surface"><div className="surface-heading"><div><span className="overline">WORKFLOW</span><h2>Status overview</h2></div><TrendingUp size={16} className="muted-icon" /></div><div className="status-stack">{stats?.status_distribution.map((item) => <div className="status-stack-row" key={item.label}><span className="status-color" style={{ background: STATUS_COLORS[item.label] ?? "#8994a3" }} /><span>{item.label}</span><div className="status-track"><i style={{ width: `${Math.max(4, item.count / totalStatus * 100)}%`, background: STATUS_COLORS[item.label] ?? "#8994a3" }} /></div><b>{item.count}</b></div>)}</div></section>
      </div>
    </div>
  </div>;
}
