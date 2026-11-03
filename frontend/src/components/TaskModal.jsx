import React, { useState, useEffect } from 'react';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../utils/constants';

export default function TaskModal({ isOpen, onClose, onSave, task = null, isSaving = false, serverErrors = {} }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [clientErrors, setClientErrors] = useState({});

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'TODO');
      setPriority(task.priority || 'MEDIUM');
      setDueDate(task.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setPriority('MEDIUM');
      setDueDate('');
    }
    setClientErrors({});
  }, [task, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Title must not be blank';
    } else if (title.trim().length > 150) {
      errors.title = 'Title must not exceed 150 characters';
    }
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      dueDate: dueDate || null
    });
  };

  const titleError = clientErrors.title || (serverErrors && serverErrors.title);

  return (
    <div className="modal-backdrop" onClick={isSaving ? undefined : onClose} role="presentation">
      <div
        className="modal-card modal-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-task-title"
      >
        <div className="modal-header">
          <h3 id="modal-task-title" className="modal-title">
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body form-grid">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="task-title" className="form-label required">
                Task Title
              </label>
              <input
                id="task-title"
                type="text"
                className={`form-input ${titleError ? 'is-invalid' : ''}`}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (clientErrors.title) {
                    setClientErrors((prev) => ({ ...prev, title: null }));
                  }
                }}
                maxLength={150}
                placeholder="e.g. Complete university project documentation"
                disabled={isSaving}
                autoFocus
              />
              <div className="form-hint-row">
                {titleError ? (
                  <span className="form-error">{titleError}</span>
                ) : (
                  <span className="form-hint">Required, up to 150 characters</span>
                )}
                <span className="char-count">{title.length}/150</span>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="task-desc" className="form-label">
                Description (Optional)
              </label>
              <textarea
                id="task-desc"
                rows={3}
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details, requirements, or links..."
                disabled={isSaving}
              />
            </div>

            {/* Status & Priority Row */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="task-status" className="form-label">
                  Status
                </label>
                <select
                  id="task-status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isSaving}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="task-priority" className="form-label">
                  Priority
                </label>
                <select
                  id="task-priority"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={isSaving}
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label htmlFor="task-due-date" className="form-label">
                Due Date (Optional)
              </label>
              <input
                id="task-due-date"
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

