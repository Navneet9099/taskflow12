import React from 'react';
import { getStatusBadge, getPriorityBadge, formatDate, STATUS_OPTIONS } from '../utils/constants';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const statusBadge = getStatusBadge(task.status);
  const priorityBadge = getPriorityBadge(task.priority);
  const formattedDueDate = formatDate(task.dueDate);

  // Highlight overdue: has a due date, not completed, and date is in the past
  const isOverdue = task.dueDate
    && task.status !== 'COMPLETED'
    && new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <article className="task-card">
      <div className="task-card-header">
        <div className="task-badges">
          <span className={`badge ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          <span className={`badge ${priorityBadge.className}`}>
            {priorityBadge.label}
          </span>
        </div>
        <div className="task-actions">
          <button
            type="button"
            className="action-btn edit-btn"
            onClick={() => onEdit(task)}
            title="Edit task"
            aria-label={`Edit ${task.title}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="action-btn delete-btn"
            onClick={() => onDelete(task)}
            title="Delete task"
            aria-label={`Delete ${task.title}`}
          >
            Delete
          </button>
        </div>
      </div>

      <h3 className="task-title" title={task.title}>
        {task.title}
      </h3>

      {task.description ? (
        <p className="task-desc" title={task.description}>
          {task.description}
        </p>
      ) : (
        <p className="task-desc empty-desc">No description provided</p>
      )}

      <div className="task-card-footer">
        <div className="task-meta">
          {formattedDueDate ? (
            <span className={`due-date${isOverdue ? ' overdue' : ''}`}>
              <span className="meta-label">Due:</span> {formattedDueDate}
              {isOverdue && <span aria-label="Overdue"> ⚠</span>}
            </span>
          ) : (
            <span className="due-date no-due">No due date</span>
          )}
        </div>

        {/* Quick status selector */}
        <div className="quick-status-wrap">
          <label htmlFor={`quick-status-${task.id}`} className="visually-hidden">
            Update status for {task.title}
          </label>
          <select
            id={`quick-status-${task.id}`}
            className="quick-status-select"
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </article>
  );
}

