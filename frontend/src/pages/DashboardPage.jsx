import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../utils/constants';

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters & Sorting state
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  // Confirm delete modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const { showToast } = useToast();

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (sortBy) params.sortBy = sortBy;
      if (order) params.order = order;

      const response = await api.get('/api/tasks', { params });
      setTasks(response.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load tasks. Please check your connection.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, sortBy, order, showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setSelectedTask(null);
    setServerErrors({});
    setIsTaskModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task) => {
    setSelectedTask(task);
    setServerErrors({});
    setIsTaskModalOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (taskData) => {
    setIsSaving(true);
    setServerErrors({});
    try {
      if (selectedTask) {
        const response = await api.put(`/api/tasks/${selectedTask.id}`, taskData);
        setTasks((prev) =>
          prev.map((t) => (t.id === selectedTask.id ? response.data : t))
        );
        showToast('Task updated successfully!', 'success');
      } else {
        const response = await api.post('/api/tasks', taskData);
        setTasks((prev) => [response.data, ...prev]);
        showToast('Task created successfully!', 'success');
      }
      setIsTaskModalOpen(false);
      setSelectedTask(null);
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        setServerErrors(err.response.data.fieldErrors);
      }
      const msg = err.response?.data?.message || 'Failed to save task. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Status Change directly from TaskCard
  const handleQuickStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;
    try {
      const payload = {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        dueDate: task.dueDate
      };
      const response = await api.put(`/api/tasks/${task.id}`, payload);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? response.data : t))
      );
      showToast(`Status changed to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update status';
      showToast(msg, 'error');
    }
  };

  // Open Delete Confirmation
  const handleOpenDeleteConfirm = (task) => {
    setTaskToDelete(task);
    setIsConfirmModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/api/tasks/${taskToDelete.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      showToast('Task deleted successfully', 'success');
      setIsConfirmModalOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete task';
      showToast(msg, 'error');
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setSortBy('createdAt');
    setOrder('desc');
  };

  const hasActiveFilters = Boolean(statusFilter || priorityFilter || sortBy !== 'createdAt' || order !== 'desc');

  return (
    <div className="dashboard-layout">
      <Navbar />

      <main className="dashboard-main">
        {/* Top Action Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Task Dashboard</h1>
            <p className="dashboard-subtitle">Organize, prioritize, and track your work efficiently</p>
            {!isLoading && !errorMessage && (
              <p className="task-count">
                {tasks.length === 0
                  ? 'No tasks'
                  : `${tasks.length} task${tasks.length !== 1 ? 's' : ''}${hasActiveFilters ? ' (filtered)' : ''}`}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary add-task-btn"
            onClick={handleOpenCreateModal}
          >
            <span className="btn-icon" aria-hidden="true">+</span> Add Task
          </button>
        </div>

        {/* Filter and Sort Toolbar */}
        <section className="toolbar-section" aria-label="Task filters and sorting">
          <div className="filter-group">
            <label htmlFor="filter-status" className="toolbar-label">
              Status:
            </label>
            <select
              id="filter-status"
              className="toolbar-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-priority" className="toolbar-label">
              Priority:
            </label>
            <select
              id="filter-priority"
              className="toolbar-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-field" className="toolbar-label">
              Sort by:
            </label>
            <select
              id="sort-field"
              className="toolbar-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">Date Created</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>

          <div className="filter-group">
            <button
              type="button"
              className="btn btn-secondary btn-order"
              onClick={() => setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              title={`Toggle sort order (Current: ${order.toUpperCase()})`}
            >
              <span>{order === 'asc' ? '↑ Ascending' : '↓ Descending'}</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline btn-clear"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          )}
        </section>

        {/* Task Cards Content */}
        {isLoading ? (
          <div className="state-card loading-state">
            <div className="spinner" aria-hidden="true" />
            <p>Loading your tasks...</p>
          </div>
        ) : errorMessage ? (
          <div className="state-card error-state">
            <span className="state-icon" aria-hidden="true">⚠️</span>
            <h3>Unable to load tasks</h3>
            <p>{errorMessage}</p>
            <button type="button" className="btn btn-primary" onClick={fetchTasks}>
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="state-card empty-state">
            <span className="state-icon" aria-hidden="true">📋</span>
            {hasActiveFilters ? (
              <>
                <h3>No tasks match your filters</h3>
                <p>Try selecting different status or priority filters to see your tasks.</p>
                <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3>No tasks yet</h3>
                <p>Stay on top of your deadlines by creating your first task.</p>
                <button type="button" className="btn btn-primary" onClick={handleOpenCreateModal}>
                  + Add Your First Task
                </button>
              </>
            )}
          </div>
        ) : (
          <section className="task-grid" aria-label="Task list">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteConfirm}
                onStatusChange={handleQuickStatusChange}
              />
            ))}
          </section>
        )}
      </main>

      {/* Add / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
          setServerErrors({});
        }}
        onSave={handleSaveTask}
        task={selectedTask}
        isSaving={isSaving}
        serverErrors={serverErrors}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${taskToDelete?.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setTaskToDelete(null);
        }}
        confirmText="Yes, Delete"
        isDanger={true}
      />
    </div>
  );
}
