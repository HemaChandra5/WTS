// src/context/FilesContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';

const FilesContext = createContext(null);
const SILENT_SYNC_SECONDS = Number(import.meta.env.VITE_SILENT_SYNC_SECONDS ?? 12);
const SILENT_SYNC_MS =
  Number.isFinite(SILENT_SYNC_SECONDS) && SILENT_SYNC_SECONDS > 0
    ? Math.max(5000, Math.floor(SILENT_SYNC_SECONDS * 1000))
    : 0;

const normalizeFile = (raw = {}) => {
  const user = raw.user || {};
  const userNameFromApi = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();

  return {
    ...raw,
    id: raw.id,
    userId: raw.userId ?? user.id,
    userName: raw.userName ?? user.name ?? userNameFromApi ?? user.username ?? 'Unknown',
    userEmail: raw.userEmail ?? user.email ?? '',
    originalName: raw.originalName ?? raw.original_name ?? '',
    mimeType: raw.mimeType ?? raw.mime_type ?? '',
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    reviewedAt: raw.reviewedAt ?? raw.reviewed_at ?? null,
    adminNote: raw.adminNote ?? raw.admin_note ?? '',
    fileName: raw.fileName ?? raw.file_name ?? '',
    cloudinaryId: raw.cloudinaryId ?? raw.cloudinary_id ?? '',
  };
};

export const FilesProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const syncInFlightRef = useRef(false);

  const fetchFiles = useCallback(async () => {
    if (syncInFlightRef.current) {
      return;
    }
    syncInFlightRef.current = true;
    try {
      const response = await api.get('/files/');
      const rows = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setFiles(rows.map(normalizeFile));
    } catch (error) {
      console.error('Failed to load files:', error);
      console.error('Response:', error.response?.data);
    } finally {
      syncInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (!SILENT_SYNC_MS) return undefined;

    const shouldSync = () =>
      document.visibilityState === 'visible' && navigator.onLine;

    const runSync = () => {
      if (!shouldSync()) return;
      fetchFiles();
    };

    const id = window.setInterval(runSync, SILENT_SYNC_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        runSync();
      }
    };

    window.addEventListener('online', runSync);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('online', runSync);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchFiles]);

  const addFile = ({ userId, userName, userEmail, file, description }) => {
    const url = URL.createObjectURL(file);

    const newFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId,
      userName,
      userEmail,
      originalName: file.name,
      description: description || '',
      createdAt: new Date().toISOString(),
      mimeType: file.type,
      size: file.size,
      url,
      downloadUrl: url,
      file: file, 
      status: 'pending',
      adminNote: '',
      reviewedAt: null,
      shared: false,
    };

    setFiles((prev) => [normalizeFile(newFile), ...prev]);
  };

  const updateFileStatus = async (id, status, adminNote = '') => {
    try {
      const response = await api.patch(`/files/${id}/update_status/`, {
        status,
        adminNote,
      });

      const updated = normalizeFile(response.data);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updated } : f))
      );

      return { success: true, file: updated };
    } catch (error) {
      console.error('Failed to update file status:', error);
      return {
        success: false,
        error:
          error?.response?.data?.detail ||
          error?.response?.data?.status?.[0] ||
          'Failed to update file status',
      };
    }
  };

  const bulkUpdateFileStatus = async (ids, status, adminNote = '') => {
    try {
      const response = await api.patch('/files/bulk_update_status/', {
        ids,
        status,
        adminNote,
      });

      const rows = Array.isArray(response.data?.files)
        ? response.data.files
        : [];
      const normalized = rows.map(normalizeFile);
      const normalizedMap = new Map(normalized.map((f) => [String(f.id), f]));

      setFiles((prev) =>
        prev.map((f) => normalizedMap.get(String(f.id)) || f)
      );

      return {
        success: true,
        updatedCount: response.data?.updatedCount ?? normalized.length,
        files: normalized,
      };
    } catch (error) {
      console.error('Failed to bulk update file status:', error);
      return {
        success: false,
        error: error?.response?.data?.detail || 'Failed to bulk update file status',
        missingIds: error?.response?.data?.missingIds || [],
      };
    }
  };

  const toggleShared = (id, value) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, shared: value } : f))
    );
  };

  const applyRealtimeFileUpdate = (rawFile) => {
    if (!rawFile) return;

    const normalized = normalizeFile(rawFile);
    setFiles((prev) => {
      const idx = prev.findIndex((f) => String(f.id) === String(normalized.id));
      if (idx === -1) {
        return [normalized, ...prev];
      }

      const next = [...prev];
      next[idx] = { ...next[idx], ...normalized };
      return next;
    });
  };

  const fetchShareTargets = async () => {
    try {
      const response = await api.get('/files/share_targets/');
      const rows = Array.isArray(response.data) ? response.data : [];
      return { success: true, users: rows };
    } catch (error) {
      console.error('Failed to fetch share targets:', error);
      return {
        success: false,
        users: [],
        error: error?.response?.data?.detail || 'Failed to fetch share targets',
      };
    }
  };

  const shareFileWithUsers = async (fileId, userIds = []) => {
    try {
      await api.post(`/files/${fileId}/share_file/`, { user_ids: userIds });
      setFiles((prev) =>
        prev.map((f) =>
          String(f.id) === String(fileId) ? { ...f, shared: true } : f
        )
      );
      return { success: true };
    } catch (error) {
      console.error('Failed to share file:', error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.response?.data?.detail || 'Failed to share file',
      };
    }
  };

  const unshareFileWithUsers = async (fileId, userIds = []) => {
    try {
      await api.post(`/files/${fileId}/unshare_file/`, { user_ids: userIds });
      return { success: true };
    } catch (error) {
      console.error('Failed to unshare file:', error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.response?.data?.detail || 'Failed to unshare file',
      };
    }
  };

  const value = {
    files,
    addFile,
    updateFileStatus,
    bulkUpdateFileStatus,
    toggleShared,
    fetchFiles,
    fetchShareTargets,
    shareFileWithUsers,
    unshareFileWithUsers,
    applyRealtimeFileUpdate,
  };

  return (
    <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
  );
};

export const useFiles = () => useContext(FilesContext);