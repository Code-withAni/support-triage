export const CATEGORIES = [
  "Application Error",
  "Authentication",
  "Database",
  "Network",
  "Performance",
  "Access / Permission",
  "Configuration",
  "Hardware",
  "Documentation",
  "Other",
] as const;

export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export const STATUSES = ["Open", "Assigned", "Investigating", "Waiting for User", "Resolved", "Closed"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type TicketStatus = (typeof STATUSES)[number];

export interface Ticket {
  id: number;
  ticket_id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: TicketStatus;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  investigation_notes: string;
  root_cause: string;
  resolution: string;
  documentation_link: string | null;
  resolution_at: string | null;
  resolution_time_minutes: number | null;
}

export interface TicketPayload {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  assigned_to: string;
  documentation_link?: string | null;
  root_cause?: string;
  resolution?: string;
  investigation_notes?: string;
}

export interface TicketList {
  items: Ticket[];
  total: number;
}

export interface DistributionItem {
  label: string;
  count: number;
}

export interface DashboardStats {
  total_tickets: number;
  open_tickets: number;
  high_critical_tickets: number;
  resolved_tickets: number;
  average_resolution_minutes: number | null;
  category_distribution: DistributionItem[];
  status_distribution: DistributionItem[];
  recent_tickets: Ticket[];
}

export interface DocumentationGuide {
  id: string;
  title: string;
  category: Category;
  symptoms: string;
  possible_causes: string;
  troubleshooting_steps: string;
  resolution: string;
}

export interface TicketFilters {
  q?: string;
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: string;
}
