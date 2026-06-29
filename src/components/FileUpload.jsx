// src/components/FileUpload.jsx
import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

const T = {
  bg1: '#FFFFFF',
  bg2: 'rgba(15,23,42,0.022)',
  bg3: 'rgba(15,23,42,0.048)',
  glassBorder: 'rgba(15,23,42,0.085)',
  bdr1: 'rgba(15,23,42,0.085)',
  txt0: '#0D1526',
  txt1: '#3D4F6B',
  txt2: '#7A8BA8',
  accent: '#4F46E5',
  accentB: '#4338CA',
  accentL: 'rgba(79,70,229,0.09)',
  accentG: 'rgba(79,70,229,0.05)',
  accentM: 'rgba(79,70,229,0.14)',
  rose: '#DC2626',
  roseD: 'rgba(220,38,38,0.08)',
};

const FONT = '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const formatSize = (bytes) => {
  if (!bytes) return '';
  const s = ['B', 'KB', 'MB', 'GB'];
  let i = 0, v = bytes;
  while (v >= 1024 && i < s.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${s[i]}`;
};

const FileUpload = ({ onUpload, prefilledFile = null, onPrefillCleared }) => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [noteFocus, setNoteFocus] = useState(false);
  const [removeHov, setRemoveHov] = useState(false);
  const [submitHov, setSubmitHov] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!prefilledFile) return;
    setFile(prefilledFile);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }, [prefilledFile]);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setError('');
    onPrefillCleared?.();
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
      onPrefillCleared?.();
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) { setError('Please choose or drop a file to upload.'); return; }
    if (!onUpload) return;
    try {
      setUploading(true);
      const p = onUpload(file, description);
      if (p instanceof Promise) await p;
      setFile(null); setDescription('');
      onPrefillCleared?.();
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section style={{
      borderRadius: 18, background: T.bg1,
      border: `1px solid ${T.glassBorder}`,
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 28px rgba(15,23,42,0.05)',
      padding: '26px 28px', fontFamily: FONT,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: T.accentL, border: '1px solid rgba(79,70,229,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowUpTrayIcon style={{ width: 18, height: 18, color: T.accent }} />
        </div>
        <div>
          <h2 style={{ fontSize: 14.5, fontWeight: 700, color: T.txt0, margin: 0, letterSpacing: '-0.02em' }}>
            Upload document
          </h2>
          <p style={{ fontSize: 11.5, color: T.txt2, margin: '2px 0 0', fontWeight: 500 }}>
            Drag & drop or click to browse — all file types accepted
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !file && inputRef.current?.click()}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, borderRadius: 14, padding: '36px 24px', textAlign: 'center',
            cursor: file ? 'default' : 'pointer',
            transition: 'all 0.18s',
            border: isDragging
              ? `2px solid ${T.accent}`
              : file
              ? `1.5px solid rgba(79,70,229,0.28)`
              : `2px dashed ${T.bdr1}`,
            background: isDragging ? T.accentG : file ? 'rgba(79,70,229,0.03)' : T.bg2,
          }}
        >
          {file ? (
            <>
              <div style={{
                width: 50, height: 50, borderRadius: 14, background: T.accentL,
                border: '1px solid rgba(79,70,229,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(79,70,229,0.14)',
              }}>
                <DocumentTextIcon style={{ width: 22, height: 22, color: T.accent }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <p style={{
                  fontSize: 13, fontWeight: 700, color: T.txt0, margin: 0,
                  maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', letterSpacing: '-0.01em',
                }}>
                  {file.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: T.txt2,
                    background: T.bg3, border: `1px solid ${T.bdr1}`,
                    borderRadius: 6, padding: '2px 9px',
                  }}>
                    {formatSize(file.size)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: T.accent }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.accent, display: 'inline-block' }} />
                    Ready to upload
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  onPrefillCleared?.();
                  if (inputRef.current) inputRef.current.value = '';
                }}
                onMouseEnter={() => setRemoveHov(true)}
                onMouseLeave={() => setRemoveHov(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: removeHov ? T.roseD : 'transparent',
                  border: `1px solid ${removeHov ? 'rgba(220,38,38,0.28)' : T.bdr1}`,
                  borderRadius: 8, padding: '5px 12px', cursor: 'pointer', transition: 'all 0.15s',
                  fontSize: 11.5, fontWeight: 600,
                  color: removeHov ? T.rose : T.txt2,
                  fontFamily: 'inherit',
                }}
              >
                <XMarkIcon style={{ width: 12, height: 12 }} />
                Remove
              </button>
            </>
          ) : (
            <>
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: isDragging ? T.accentL : T.accentG,
                border: `1px solid ${isDragging ? 'rgba(79,70,229,0.30)' : 'rgba(79,70,229,0.14)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s',
              }}>
                <ArrowUpTrayIcon style={{ width: 21, height: 21, color: isDragging ? T.accent : 'rgba(79,70,229,0.55)' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.txt1, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  {isDragging ? 'Release to attach file' : 'Drag & drop your file here'}
                </p>
                <p style={{ fontSize: 12, color: T.txt2, margin: 0 }}>
                  or <span style={{ color: T.accent, fontWeight: 600 }}>click to browse</span> from your device
                </p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: T.txt2,
                background: T.bg3, border: `1px solid ${T.bdr1}`,
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
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: T.txt1, marginBottom: 6, letterSpacing: '-0.01em' }}>
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
              padding: '10px 13px', fontSize: 12.5, color: T.txt0,
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
            background: T.roseD, border: '1px solid rgba(220,38,38,0.20)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.rose, flexShrink: 0 }} />
            <p style={{ fontSize: 12.5, color: T.rose, margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 2 }}>
          <p style={{ fontSize: 11.5, color: T.txt2, margin: 0, lineHeight: 1.5 }}>
            Use "Send to Admin" from My Files to preload a document here.
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
                : submitHov ? T.accentB : T.accent,
              border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700, color: '#fff',
              boxShadow: uploading ? 'none' : '0 4px 16px rgba(79,70,229,0.30)',
              transition: 'all 0.18s', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em', fontFamily: 'inherit',
              transform: submitHov && !uploading ? 'translateY(-1px)' : 'translateY(0)',
            }}
          >
            {uploading ? (
              <><SpinnerIcon />Uploading…</>
            ) : (
              <><ArrowUpTrayIcon style={{ width: 14, height: 14 }} />Upload file</>
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