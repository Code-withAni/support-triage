import type { Priority, TicketStatus } from "../types";

export function PriorityBadge({ value }: { value: Priority }) {
  return <span className={`badge priority priority-${value.toLowerCase()}`}><i />{value}</span>;
}

export function StatusBadge({ value }: { value: TicketStatus }) {
  return <span className={`badge status status-${value.toLowerCase().replaceAll(" ", "-")}`}><i />{value}</span>;
}
