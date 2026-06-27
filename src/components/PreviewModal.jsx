// src/components/PreviewModal.jsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

/* Admin palette */
const D = {
  txt0: '#0D1526', txt1: '#3D4F6B', txt2: '#7A8BA8',
  accent: '#3454D1', accentL: 'rgba(52,84,209,0.09)', accentB: 'rgba(52,84,209,0.22)',
  border: 'rgba(15,23,42,0.085)',
  surface: '#FFFFFF', surface2: 'rgba(15,23,42,0.022)',
};

/* Employee palette */
const L = {
  txt0: '#0D1526', txt1: '#3D4F6B', txt2: '#7A8BA8',
  accent: '#4F46E5', accentL: 'rgba(79,70,229,0.09)', accentB: 'rgba(79,70,229,0.24)',
  border: 'rgba(15,23,42,0.085)',
  surface: '#FFFFFF', surface2: 'rgba(15,23,42,0.022)',
};

const FONT = '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const PreviewModal = ({ file, open, onClose, isAdmin = false }) => {
  const T = isAdmin ? D : L;
  const [loading, setLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [content, setContent] = useState('');
  const [closeHov, setCloseHov] = useState(false);
  const [dlHov, setDlHov] = useState(false);

  useEffect(() => {
    if (!open || !file) { setLoading(true); setContent(''); setPreviewError(false); return; }
    loadPreview();
  }, [open, file]);

  const loadPreview = async () => {
    setLoading(true); setPreviewError(false); setContent('');
    try {
      const { mimeType, originalName, file: fileObj } = file;
      const type = mimeType?.toLowerCase() || '';
      const name = originalName?.toLowerCase() || '';

      const isTextType =
        type.includes('text') || type.includes('plain') || type.includes('json') ||
        type.includes('csv') || type.includes('xml') || type.includes('html') ||
        name.match(/\.(txt|csv|json|xml|html|log)$/);

      if (isTextType && fileObj instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => { setContent(e.target.result); setLoading(false); };
        reader.onerror = () => { setPreviewError(true); setLoading(false); };
        reader.readAsText(fileObj);
        return;
      }
      setLoading(false);
    } catch (error) {
      setPreviewError(true); setLoading(false);
    }
  };

  if (!open || !file) return null;

  const resolvedUrl = file.url || file.downloadUrl || null;

  const downloadFile = () => {
    if (!resolvedUrl) { window.alert('File link is not available.'); return; }
    const a = document.createElement('a');
    a.href = resolvedUrl; a.download = file.originalName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const type = file.mimeType?.toLowerCase() || '';
  const name = file.originalName?.toLowerCase() || '';
  const isImage = type.includes('image');
  const isPdf = type.includes('pdf') || name.endsWith('.pdf');
  const isText = type.includes('text') || type.includes('plain') || type.includes('json') ||
    type.includes('csv') || type.includes('xml') || type.includes('html') ||
    name.match(/\.(txt|csv|json|xml|html|log)$/);
  const canPreview = isImage || isPdf || isText;

  const fmtSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const s = ['B', 'KB', 'MB', 'GB'];
    let i = 0, v = bytes;
    while (v >= 1024 && i < s.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(1)} ${s[i]}`;
  };

  const NoPreviewState = ({ title, message }) => {
    const [hov, setHov] = useState(false);
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: T.surface, borderRadius: 16, padding: 40, textAlign: 'center',
        border: `2px dashed ${T.border}`,
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: 18, background: T.accentL,
          border: `1px solid ${T.accentB}`, marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <DocumentTextIcon style={{ width: 30, height: 30, color: T.accent }} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: T.txt0, margin: '0 0 8px', letterSpacing: '-0.015em' }}>{title}</p>
        <p style={{ fontSize: 13, color: T.txt1, margin: '0 0 24px', maxWidth: 340, lineHeight: 1.55 }}>{message}</p>
        <button
          onClick={downloadFile}
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10,
            background: T.accent, padding: '9px 18px', fontSize: 13, fontWeight: 700,
            color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: 'inherit',
            boxShadow: hov ? `0 6px 18px ${T.accentL}` : '0 2px 8px rgba(0,0,0,0.08)',
            transform: hov ? 'translateY(-1px)' : 'translateY(0)',
          }}
        >
          <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
          Download instead
        </button>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, fontFamily: FONT,
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(13,21,38,0.55)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 920, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', borderRadius: 20, background: T.surface,
        boxShadow: '0 32px 80px rgba(13,21,38,0.28), 0 8px 24px rgba(13,21,38,0.08)',
        overflow: 'hidden', border: `1px solid ${T.border}`,
        animation: 'pmIn 0.22s cubic-bezier(.16,1,.3,1)',
      }}>
        <style>{`@keyframes pmIn { from{opacity:0;transform:scale(0.97) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${T.border}`, background: T.surface, padding: '16px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, background: T.accentL,
              border: `1px solid ${T.accentB}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <DocumentTextIcon style={{ width: 17, height: 17, color: T.accent }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 13.5, fontWeight: 700, color: T.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.015em' }}>
                {file.originalName}
              </h2>
              <p style={{ fontSize: 11.5, color: T.txt2, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {file.description || 'No description'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHov(true)} onMouseLeave={() => setCloseHov(false)}
            style={{
              display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center',
              borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
              background: closeHov ? 'rgba(15,23,42,0.07)' : 'transparent',
              color: closeHov ? T.txt0 : T.txt1,
            }}
          >
            <XMarkIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: T.surface2 }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  margin: '0 auto', width: 40, height: 40, borderRadius: '50%',
                  border: `3px solid ${T.border}`, borderTopColor: T.accent,
                  animation: 'pmSpin 0.8s linear infinite',
                }} />
                <style>{`@keyframes pmSpin { to{ transform: rotate(360deg); } }`}</style>
                <p style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: T.txt1 }}>Loading preview…</p>
              </div>
            </div>
          )}

          {!loading && !previewError && (
            <>
              {isImage && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: T.surface, borderRadius: 16, padding: 16, border: `1px solid ${T.border}`,
                }}>
                  <img
                    src={resolvedUrl} alt={file.originalName}
                    style={{ maxHeight: 600, maxWidth: '100%', borderRadius: 10, objectFit: 'contain' }}
                    onError={() => setPreviewError(true)}
                  />
                </div>
              )}

              {isPdf && (
                <div style={{ width: '100%', height: 700, borderRadius: 16, overflow: 'hidden', background: T.surface, border: `1px solid ${T.border}` }}>
                  <iframe
                    src={resolvedUrl} style={{ width: '100%', height: '100%', border: 0 }}
                    title={file.originalName} onError={() => setPreviewError(true)}
                  />
                </div>
              )}

              {isText && content && (
                <div style={{
                  background: '#0F1629', color: '#CBD5E1', padding: 20, borderRadius: 16,
                  fontFamily: '"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace',
                  fontSize: 12, overflow: 'auto', maxHeight: 600,
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.25)',
                  lineHeight: 1.7,
                }}>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                    {content}
                  </pre>
                </div>
              )}

              {!canPreview && (
                <NoPreviewState
                  title={`Can't preview ${file.originalName}`}
                  message="This file type can't be previewed in the browser. Download it to view with a compatible app."
                />
              )}
            </>
          )}

          {previewError && (
            <NoPreviewState
              title="Preview unavailable"
              message="There was a problem loading this file preview. You can still download it below."
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid ${T.border}`, background: T.surface, padding: '14px 24px',
        }}>
          <p style={{ fontSize: 12, color: T.txt2, margin: 0, fontWeight: 500 }}>
            {fmtSize(file.size)}
          </p>
          <button
            onClick={downloadFile}
            onMouseEnter={() => setDlHov(true)} onMouseLeave={() => setDlHov(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, borderRadius: 10,
              border: `1px solid ${dlHov ? T.accentB : T.border}`,
              background: dlHov ? T.accentL : T.surface,
              padding: '8px 16px', fontSize: 12.5, fontWeight: 700,
              color: dlHov ? T.accent : T.txt1,
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
              boxShadow: dlHov ? `0 2px 10px ${T.accentL}` : 'none',
            }}
          >
            <ArrowDownTrayIcon style={{ width: 14, height: 14 }} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;