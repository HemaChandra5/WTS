import React, { useState, useRef } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

/* ─── Light SaaS tokens — identical to EmployeeDashboard.jsx ── */
const T = {
  bg1: '#FFFFFF',
  bg2: 'rgba(15,23,42,0.025)',
  bg3: 'rgba(15,23,42,0.055)',
  glassBorder: 'rgba(15,23,42,0.09)',
  bdr1: 'rgba(15,23,42,0.10)',
  txt0: '#0F172A',
  txt1: '#475569',
  txt2: '#64748B',
  accent: '#4F46E5',
  accentB: '#4338CA',
  accentL: 'rgba(79,70,229,0.10)',
  accentG: 'rgba(79,70,229,0.06)',
  accentM: 'rgba(79,70,229,0.16)',
  rose: '#F43F5E',
  roseD: 'rgba(244,63,94,0.10)',
};

const FONT = '"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const FileUpload = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [noteFocus, setNoteFocus] = useState(false);
  const [removeHov, setRemoveHov] = useState(false);
  const [submitHov, setSubmitHov] = useState(false);
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
      borderRadius: 18,
      background: T.bg1,
      border: `1px solid ${T.glassBorder}`,
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 6px 24px rgba(15,23,42,0.05)',
      padding: '28px',
      fontFamily: FONT,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: T.accentL,
          border: '1px solid rgba(79,70,229,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowUpTrayIcon style={{ width: 18, height: 18, color: T.accent }} />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: T.txt0, margin: 0, letterSpacing: '-0.02em' }}>
            Upload a file
          </h2>
          <p style={{ fontSize: 12, color: T.txt2, margin: '2px 0 0' }}>
            Drag &amp; drop or click to browse — all file types accepted
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !file && inputRef.current?.click()}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 14, borderRadius: 14, padding: '40px 24px', textAlign: 'center',
            cursor: file ? 'default' : 'pointer',
            transition: 'all 0.18s',
            border: isDragging
              ? `2px solid ${T.accent}`
              : file
              ? `1.5px solid rgba(79,70,229,0.28)`
              : `2px dashed ${T.bdr1}`,
            background: isDragging
              ? T.accentG
              : file
              ? 'rgba(79,70,229,0.04)'
              : T.bg2,
          }}
        >
          {file ? (
            <>
              {/* File icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: T.accentL,
                border: '1px solid rgba(79,70,229,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(79,70,229,0.12)',
              }}>
                <DocumentTextIcon style={{ width: 24, height: 24, color: T.accent }} />
              </div>

              {/* File meta */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <p style={{
                  fontSize: 13.5, fontWeight: 700, color: T.txt0, margin: 0,
                  maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', letterSpacing: '-0.01em',
                }}>
                  {file.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11.5, fontWeight: 600, color: T.txt2,
                    background: T.bg3,
                    border: `1px solid ${T.bdr1}`,
                    borderRadius: 6, padding: '2px 9px',
                  }}>
                    {formatSize(file.size)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: T.accent }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, display: 'inline-block' }} />
                    Ready to submit
                  </span>
                </div>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
                onMouseEnter={() => setRemoveHov(true)}
                onMouseLeave={() => setRemoveHov(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: removeHov ? T.roseD : 'transparent',
                  border: `1px solid ${removeHov ? 'rgba(244,63,94,0.28)' : T.bdr1}`,
                  borderRadius: 8, padding: '5px 12px', cursor: 'pointer', transition: 'all 0.15s',
                  fontSize: 12, fontWeight: 600,
                  color: removeHov ? T.rose : T.txt2,
                  fontFamily: 'inherit',
                }}
              >
                <XMarkIcon style={{ width: 12, height: 12 }} />
                Remove file
              </button>
            </>
          ) : (
            <>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: isDragging ? T.accentL : T.accentG,
                border: `1px solid ${isDragging ? 'rgba(79,70,229,0.30)' : 'rgba(79,70,229,0.14)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s',
              }}>
                <ArrowUpTrayIcon style={{ width: 22, height: 22, color: isDragging ? T.accent : 'rgba(79,70,229,0.55)' }} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt1, margin: '0 0 5px', letterSpacing: '-0.01em' }}>
                  {isDragging ? 'Release to attach file' : 'Drag & drop your file here'}
                </p>
                <p style={{ fontSize: 12, color: T.txt2, margin: 0 }}>
                  or <span style={{ color: T.accent, fontWeight: 600 }}>click to browse</span> from your device
                </p>
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 700, color: T.txt2,
                background: T.bg3,
                border: `1px solid ${T.bdr1}`,
                borderRadius: 6, padding: '3px 10px',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                All file types · No size limit
              </span>
            </>
          )}
          <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {/* Notes */}
        <div>
          <label style={{
            display: 'block', fontSize: 12, fontWeight: 600, color: T.txt1,
            marginBottom: 7, letterSpacing: '-0.01em',
          }}>
            Notes <span style={{ color: T.txt2, fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short note about this file…"
            onFocus={() => setNoteFocus(true)}
            onBlur={() => setNoteFocus(false)}
            style={{
              width: '100%', borderRadius: 10,
              border: `1px solid ${noteFocus ? T.accent : T.bdr1}`,
              background: noteFocus ? '#fff' : T.bg2,
              padding: '10px 13px', fontSize: 13, color: T.txt0,
              resize: 'none', outline: 'none', transition: 'all 0.15s',
              fontFamily: 'inherit', boxSizing: 'border-box',
              boxShadow: noteFocus ? `0 0 0 3px ${T.accentG}` : 'none',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            borderRadius: 9, padding: '9px 12px',
            background: T.roseD,
            border: '1px solid rgba(244,63,94,0.20)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.rose, flexShrink: 0 }} />
            <p style={{ fontSize: 12.5, color: T.rose, margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 }}>
          <p style={{ fontSize: 12, color: T.txt2, margin: 0, lineHeight: 1.5 }}>
            Share your work from the file list using the "Share" action.
          </p>
          <button
            type="submit"
            disabled={uploading}
            onMouseEnter={() => setSubmitHov(true)}
            onMouseLeave={() => setSubmitHov(false)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              borderRadius: 10, padding: '10px 22px',
              background: uploading
                ? 'rgba(79,70,229,0.45)'
                : submitHov
                ? T.accentB
                : T.accent,
              border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700, color: '#fff',
              boxShadow: uploading ? 'none' : '0 4px 16px rgba(79,70,229,0.28)',
              transition: 'all 0.18s', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em', fontFamily: 'inherit',
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
    <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.30)" strokeWidth="2.5" />
    <path d="M12 3a9 9 0 019 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export default FileUpload;