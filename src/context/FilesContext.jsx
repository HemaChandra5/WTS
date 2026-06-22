// src/context/FilesContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const FilesContext = createContext(null);

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
  useEffect(() => {
  console.log('Files state changed:', files);
}, [files]);

  const fetchFiles = async () => {
  try {
    console.log('Fetching files...');

    const response = await api.get('/files/');
    const rows = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.results)
      ? response.data.results
      : [];

    console.log('Files response:', response.data);

    setFiles(rows.map(normalizeFile));
  } catch (error) {
    console.error('Failed to load files:', error);
    console.error('Response:', error.response?.data);
  }
};

  useEffect(() => {
    fetchFiles();
  }, []);

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

  const updateFileStatus = (id, status, adminNote = '') => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              status,
              adminNote,
              reviewedAt: new Date().toISOString(),
            }
          : f
      )
    );
  };

  const toggleShared = (id, value) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, shared: value } : f))
    );
  };

  const value = { files, addFile, updateFileStatus, toggleShared, fetchFiles };

  return (
    <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
  );
};

export const useFiles = () => useContext(FilesContext);