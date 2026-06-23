import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';

const TasksContext = createContext(null);

const normalizeTask = (raw = {}) => ({
  ...raw,
  id: raw.id,
  title: raw.title || '',
  description: raw.description || '',
  assignedToEmail: raw.assignedToEmail ?? raw.assigned_to_email ?? '',
  assignedToUser: raw.assignedToUser ?? raw.assigned_to_user ?? null,
  assignedByUser: raw.assignedByUser ?? raw.assigned_by_user ?? null,
  status: raw.status || 'pending',
  priority: raw.priority || 'medium',
  adminFile: raw.adminFile ?? raw.admin_file ?? null,
  dueDate: raw.dueDate ?? raw.due_date ?? null,
  completedAt: raw.completedAt ?? raw.completed_at ?? null,
  createdAt: raw.createdAt ?? raw.created_at ?? null,
  updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
});

export const TasksProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks/');
      const rows = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
        ? response.data.results
        : [];
      setTasks(rows.map(normalizeTask));
      return { success: true };
    } catch (error) {
      console.error('Failed to load tasks:', error);
      return { success: false, error: error?.response?.data?.detail || 'Failed to load tasks' };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const WS_BASE_URL = import.meta.env.VITE_WS_URL || API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '');
  const token = localStorage.getItem('token');

  useWebSocket(
    token ? `${WS_BASE_URL}/ws/tasks/` : null,
    (data) => {
      if (!data?.type) return;
      if (data.type === 'task_notification' || data.type === 'task_status_update') {
        fetchTasks();
      }
    },
    (error) => {
      console.error('Tasks websocket error:', error);
    },
  );

  const addTask = useCallback(async ({ title, description, assignedToEmail, priority, dueDate, adminFile }) => {
    try {
      const payload = new FormData();
      payload.append('title', title);
      payload.append('description', description || '');
      payload.append('assigned_to_email', assignedToEmail);
      payload.append('priority', priority || 'medium');
      if (dueDate) payload.append('due_date', dueDate);
      if (adminFile) payload.append('admin_file', adminFile);

      const response = await api.post('/tasks/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const created = normalizeTask(response.data);
      setTasks((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      return { success: true, task: created };
    } catch (error) {
      console.error('Failed to create task:', error);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0] ||
        error?.response?.data?.assigned_to_email?.[0] ||
        'Failed to create task';
      return { success: false, error: message };
    }
  }, []);

  const updateTaskStatus = useCallback(async (id, status) => {
    try {
      const response = await api.patch(`/tasks/${id}/update_status/`, { status });
      const updated = normalizeTask(response.data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return { success: true, task: updated };
    } catch (error) {
      console.error('Failed to update task status:', error);
      return { success: false, error: error?.response?.data?.detail || 'Failed to update task status' };
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await api.delete(`/tasks/${id}/`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Failed to delete task:', error);
      return { success: false, error: error?.response?.data?.detail || 'Failed to delete task' };
    }
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      loading,
      fetchTasks,
      addTask,
      updateTaskStatus,
      deleteTask,
    }),
    [tasks, loading, fetchTasks, addTask, updateTaskStatus, deleteTask],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

export const useTasks = () => {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  return ctx;
};
