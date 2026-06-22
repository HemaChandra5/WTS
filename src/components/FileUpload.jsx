// src/components/FileUpload.jsx
import React, { useState, useRef } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

/* ─── Employee luxury-white tokens ──────────────────────────────────── */
const L = {
  bg:       '#ffffff',
  surface:  '#f8fafc',
  border:   'rgba(15,23,42,0.08)',
  borderActive: 'rgba(79,70,229,0.40)',
  txt0:     '#0f172a',
  txt1:     '#475569',
  txt2:     '#94a3b8',
  accent:   '#4f46e5',
  accentL:  'rgba(79,70,229,0.07)',
  accentL2: 'rgba(79,70,229,0.12)',
  emerald:  '#059669',
  emeraldL: 'rgba(5,150,105,0.07)',
  rose:     '#dc2626',
  roseL:    'rgba(220,38,38,0.06)',
};

const FONT = "'Inter', 'DM Sans', system-ui, sans-serif";

const FileUpload = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [noteFocus, setNoteFocus] = useState(false);
  const [removeHov, setRemoveHov] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please choose or drop a file to upload.');
      return;
    }
    if (!onUpload) return;
    try {
      setUploading(true);
      const maybePromise = onUpload(file, description);
      if (maybePromise instanceof Promise) await maybePromise;
      setFile(null);
      setDescription('');
      if (inputRef.current) inputRef.current.value = '';
      if (e.target?.reset) e.target.reset();
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    let i = 0, v = bytes;
    while (v >= 1024 && i < sizes.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(1)} ${sizes[i]}`;
  };

  return (
    <section style={{
      borderRadius: 16,
      background: L.bg,
      border: `1px solid ${L.border}`,
      boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)',
      padding: '28px 28px',
      fontFamily: FONT,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: L.accentL2,
          border: `1px solid rgba(79,70,229,0.18)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowUpTrayIcon style={{ width: 18, height: 18, color: L.accent }} />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: L.txt0, margin: 0, letterSpacing: '-0.02em' }}>
            Upload a file
          </h2>
          <p style={{ fontSize: 12, color: L.txt2, margin: '2px 0 0' }}>
            Drag &amp; drop or click to browse
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.18s',
            border: isDragging
              ? `2px solid ${L.accent}`
              : file
              ? `2px solid rgba(5,150,105,0.35)`
              : `2px dashed ${L.border}`,
            background: isDragging
              ? L.accentL
              : file
              ? L.emeraldL
              : L.surface,
          }}
        >
          {file ? (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: L.emeraldL,
                border: `1px solid rgba(5,150,105,0.22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DocumentTextIcon style={{ width: 22, height: 22, color: L.emerald }} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: L.txt0, margin: '0 0 3px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: 12, color: L.emerald, fontWeight: 500, margin: 0 }}>
                  {formatSize(file.size)} · Ready to upload
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
                onMouseEnter={() => setRemoveHov(true)}
                onMouseLeave={() => setRemoveHov(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: removeHov ? 'rgba(220,38,38,0.10)' : L.roseL,
                  border: `1px solid rgba(220,38,38,0.18)`,
                  borderRadius: 7, padding: '4px 10px', cursor: 'pointer', transition: 'background 0.14s',
                  fontSize: 12, fontWeight: 600, color: L.rose, fontFamily: FONT,
                }}
              >
                <XMarkIcon style={{ width: 12, height: 12 }} />
                Remove
              </button>
            </>
          ) : (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: isDragging ? L.accentL2 : L.accentL,
                border: `1px solid ${isDragging ? 'rgba(79,70,229,0.28)' : 'rgba(79,70,229,0.14)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s',
              }}>
                <ArrowUpTrayIcon style={{ width: 22, height: 22, color: isDragging ? L.accent : '#818cf8' }} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: L.txt1, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  {isDragging ? 'Drop your file here' : 'Drag & drop files here'}
                </p>
                <p style={{ fontSize: 12, color: L.txt2, margin: 0 }}>or click to browse from your device</p>
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 600, color: L.txt2,
                background: '#f1f5f9',
                border: `1px solid ${L.border}`,
                borderRadius: 5, padding: '3px 9px', letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                All file types accepted
              </span>
            </>
          )}
          <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: L.txt1, marginBottom: 7, letterSpacing: '-0.01em' }}>
            Notes <span style={{ color: L.txt2, fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short note about this file..."
            onFocus={() => setNoteFocus(true)}
            onBlur={() => setNoteFocus(false)}
            style={{
              width: '100%', borderRadius: 10,
              border: `1px solid ${noteFocus ? L.accent : L.border}`,
              background: noteFocus ? '#ffffff' : L.surface,
              padding: '10px 13px', fontSize: 13, color: L.txt0,
              resize: 'none', outline: 'none', transition: 'all 0.15s',
              fontFamily: FONT, boxSizing: 'border-box',
              boxShadow: noteFocus ? `0 0 0 3px rgba(79,70,229,0.10)` : 'none',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            borderRadius: 8, padding: '9px 12px',
            background: L.roseL, border: `1px solid rgba(220,38,38,0.16)`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: L.rose, flexShrink: 0 }} />
            <p style={{ fontSize: 12.5, color: L.rose, margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: 12, color: L.txt2, margin: 0, lineHeight: 1.5 }}>
            You can share your work later from the list using the "Share" action.
          </p>
          <button
            type="submit"
            disabled={uploading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              borderRadius: 9, padding: '10px 20px',
              background: uploading
                ? 'rgba(79,70,229,0.40)'
                : '#4f46e5',
              border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600, color: '#fff',
              boxShadow: uploading ? 'none' : '0 1px 3px rgba(79,70,229,0.30), 0 4px 14px rgba(79,70,229,0.20)',
              transition: 'all 0.18s', whiteSpace: 'nowrap', letterSpacing: '-0.01em',
              fontFamily: FONT,
            }}
          >
            {uploading ? (
              <>
                <SpinnerIcon />
                Uploading…
              </>
            ) : (
              <>
                <ArrowUpTrayIcon style={{ width: 14, height: 14 }} />
                Upload file
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'fuSpin 0.75s linear infinite' }}>
    <style>{`@keyframes fuSpin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
    <path d="M12 3a9 9 0 019 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export default FileUpload;