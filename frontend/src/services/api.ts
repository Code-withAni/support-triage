import type { DashboardStats, DocumentationGuide, Ticket, TicketFilters, TicketList, TicketPayload, TicketStatus } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { detail?: string | Array<{ msg?: string }> };
      if (typeof payload.detail === "string") detail = payload.detail;
      else if (Array.isArray(payload.detail)) detail = payload.detail.map((item) => item.msg).filter(Boolean).join("; ") || detail;
    } catch {
      // Keep the HTTP status message when the server did not return JSON.
    }
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  dashboard: () => request<DashboardStats>("/dashboard/stats"),
  tickets: (filters: TicketFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value?.trim()) params.set(key, value.trim());
    });
    const query = params.toString();
    return request<TicketList>(`/tickets${query ? `?${query}` : ""}`);
  },
  ticket: (id: number) => request<Ticket>(`/tickets/${id}`),
  createTicket: (payload: TicketPayload) => request<Ticket>("/tickets", { method: "POST", body: payload }),
  updateTicket: (id: number, payload: Partial<TicketPayload> & { add_note?: string }) => request<Ticket>(`/tickets/${id}`, { method: "PUT", body: payload }),
  updateStatus: (id: number, status: TicketStatus) => request<Ticket>(`/tickets/${id}/status`, { method: "PATCH", body: { status } }),
  categorize: (title: string, description: string) => request<{ category: string; matched_rule: string }>("/tickets/categorize", { method: "POST", body: { title, description } }),
  documentation: () => request<DocumentationGuide[]>("/documentation"),
  guide: (id: string) => request<DocumentationGuide>(`/documentation/${id}`),
};
