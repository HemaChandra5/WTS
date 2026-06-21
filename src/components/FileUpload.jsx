// src/components/FileUpload.jsx
import React, { useState, useRef } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

/* ─── Ivory/gold employee tokens ────────────────────────────────────── */
const L = {
  glass:    'rgba(255,253,249,0.82)',
  border:   'rgba(212,175,122,0.20)',
  borderHov:'rgba(212,175,122,0.38)',
  txt0:     '#1c1917',
  txt1:     '#78716c',
  txt2:     '#a8a29e',
  accent:   '#a8761e',
  accentL:  'rgba(168,118,30,0.08)',
  accentL2: 'rgba(168,118,30,0.14)',
  emerald:  '#059669',
  emeraldL: 'rgba(16,185,129,0.08)',
  rose:     '#e11d48',
  roseL:    'rgba(225,29,72,0.07)',
};

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
      borderRadius: 20,
      background: L.glass,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: `1px solid ${L.border}`,
      boxShadow: '0 1px 2px rgba(120,98,53,0.04), 0 8px 24px rgba(120,98,53,0.07)',
      padding: 28,
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: `linear-gradient(135deg, ${L.accentL2}, rgba(201,162,94,0.12))`,
            border: `1px solid ${L.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CloudUploadIcon />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: L.txt0, margin: 0, letterSpacing: '-0.01em' }}>
              Upload a file
            </h2>
            <p style={{ fontSize: 11, color: L.txt2, margin: '2px 0 0', fontWeight: 500 }}>
              Drag &amp; drop or click to browse
            </p>
          </div>
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
            gap: 10, borderRadius: 16, padding: '36px 24px', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            border: isDragging
              ? `2px solid ${L.accent}`
              : file
              ? '2px solid rgba(16,185,129,0.40)'
              : `2px dashed ${L.borderHov}`,
            background: isDragging
              ? L.accentL
              : file
              ? L.emeraldL
              : 'rgba(212,175,122,0.035)',
            boxShadow: isDragging ? `0 0 0 4px ${L.accentL}` : 'none',
          }}
        >
          {file ? (
            <>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: L.emeraldL,
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DocumentTextIcon style={{ width: 26, height: 26, color: L.emerald }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: L.txt0, margin: '0 0 2px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: 11, color: L.emerald, fontWeight: 600, margin: 0 }}>
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
                  background: removeHov ? 'rgba(225,29,72,0.12)' : L.roseL,
                  border: '1px solid rgba(225,29,72,0.22)',
                  borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'background 0.15s',
                  fontSize: 11, fontWeight: 600, color: L.rose,
                }}
              >
                <XMarkIcon style={{ width: 12, height: 12 }} /> Remove
              </button>
            </>
          ) : (
            <>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: isDragging ? L.accentL2 : L.accentL,
                border: `1px solid ${isDragging ? L.borderHov : L.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <ArrowUpTrayIcon style={{ width: 24, height: 24, color: isDragging ? L.accent : '#c9a25e' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: L.txt1, margin: '0 0 3px' }}>
                  {isDragging ? 'Drop your file here' : 'Drag & drop files here'}
                </p>
                <p style={{ fontSize: 11, color: L.txt2, margin: 0 }}>or click to browse from your device</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: L.txt2,
                background: L.accentL, border: `1px solid ${L.border}`,
                borderRadius: 6, padding: '3px 10px', letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Any file type accepted
              </span>
            </>
          )}
          <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: L.txt1, marginBottom: 6, letterSpacing: '0.01em' }}>
            Notes <span style={{ color: L.txt2, fontWeight: 500 }}>(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short note about this file..."
            onFocus={() => setNoteFocus(true)}
            onBlur={() => setNoteFocus(false)}
            style={{
              width: '100%', borderRadius: 12,
              border: `1px solid ${noteFocus ? L.accent : L.border}`,
              background: 'rgba(212,175,122,0.035)',
              padding: '10px 14px', fontSize: 13, color: L.txt0,
              resize: 'none', outline: 'none', transition: 'all 0.18s',
              fontFamily: 'inherit', boxSizing: 'border-box',
              boxShadow: noteFocus ? `0 0 0 3px ${L.accentL}` : 'none',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            borderRadius: 10, padding: '8px 12px',
            background: L.roseL, border: '1px solid rgba(225,29,72,0.22)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: L.rose, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: L.rose, margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: 11, color: L.txt2, margin: 0, lineHeight: 1.4 }}>
            You can share your work later from the list using the "Share" action.
          </p>
          <button
            type="submit"
            disabled={uploading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              borderRadius: 12, padding: '10px 22px',
              background: uploading ? 'rgba(168,118,30,0.40)' : `linear-gradient(135deg, ${L.accent}, #8f6118)`,
              border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700, color: '#fff',
              boxShadow: uploading ? 'none' : '0 4px 16px rgba(168,118,30,0.28), 0 1px 0 rgba(255,255,255,0.18) inset',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
            }}
          >
            {uploading ? (
              <>
                <SpinnerIcon />
                Uploading…
              </>
            ) : (
              <>
                <ArrowUpTrayIcon style={{ width: 15, height: 15 }} />
                Upload file
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

const CloudUploadIcon = () => (
  <svg width="20" height="20" fill="none" stroke="#a8761e" strokeWidth="1.7" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V8m0 0l-3 3m3-3l3 3M6.5 19a4.5 4.5 0 01-.916-8.916A6 6 0 0112 4a6 6 0 015.416 8.084A4.5 4.5 0 0117.5 19h-11z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'sskatt-spin 0.8s linear infinite' }}>
    <style>{`@keyframes sskatt-spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
    <path d="M12 3a9 9 0 019 9" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default FileUpload;