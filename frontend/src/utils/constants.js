export const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do', className: 'badge-todo' },
  { value: 'IN_PROGRESS', label: 'In Progress', className: 'badge-in-progress' },
  { value: 'COMPLETED', label: 'Completed', className: 'badge-completed' }
];

export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', className: 'badge-low' },
  { value: 'MEDIUM', label: 'Medium', className: 'badge-medium' },
  { value: 'HIGH', label: 'High', className: 'badge-high' }
];

export function getStatusBadge(status) {
  const match = STATUS_OPTIONS.find((s) => s.value === status);
  return match || { value: status, label: status, className: 'badge-default' };
}

export function getPriorityBadge(priority) {
  const match = PRIORITY_OPTIONS.find((p) => p.value === priority);
  return match || { value: priority, label: priority, className: 'badge-default' };
}

export function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

