// src/components/PreviewModal.jsx
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

/* ─── Ivory/gold employee tokens ────────────────────────────────────── */
const L = {
  border:   'rgba(212,175,122,0.20)',
  txt0:     '#1c1917',
  txt1:     '#78716c',
  txt2:     '#a8a29e',
  accent:   '#a8761e',
  accentL:  'rgba(168,118,30,0.08)',
  surface:  '#fffefb',
  surface2: 'rgba(212,175,122,0.05)',
  codeBg:   '#211d18',
};

const PreviewModal = ({ file, open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [content, setContent] = useState('');
  const [closeHov, setCloseHov] = useState(false);
  const [dlHov, setDlHov] = useState(false);
  const [dlFooterHov, setDlFooterHov] = useState(false);

  useEffect(() => {
    if (!open || !file) {
      setLoading(true);
      setContent('');
      setPreviewError(false);
      return;
    }

    loadPreview();
  }, [open, file]);

  const loadPreview = async () => {
    setLoading(true);
    setPreviewError(false);
    setContent('');

    try {
      const { mimeType, originalName, file: fileObj, url } = file;
      const type = mimeType?.toLowerCase() || '';
      const name = originalName?.toLowerCase() || '';

      // Text files - use FileReader if we have the File object
      if (
        type.includes('text') ||
        type.includes('plain') ||
        type.includes('json') ||
        type.includes('csv') ||
        type.includes('xml') ||
        type.includes('html') ||
        name.match(/\.(txt|csv|json|xml|html|log)$/)
      ) {
        if (fileObj instanceof File) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setContent(e.target.result);
            setLoading(false);
          };
          reader.onerror = () => {
            setPreviewError(true);
            setLoading(false);
          };
          reader.readAsText(fileObj);
          return;
        }
      }

      // For images and PDFs, just wait for them to load
      setLoading(false);
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewError(true);
      setLoading(false);
    }
  };

  if (!open || !file) return null;

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = file.mimeType?.toLowerCase().includes('image');
  const isPdf =
    file.mimeType?.toLowerCase().includes('pdf') ||
    file.originalName?.toLowerCase().endsWith('.pdf');
  const isText =
    file.mimeType?.toLowerCase().includes('text') ||
    file.mimeType?.toLowerCase().includes('plain') ||
    file.mimeType?.toLowerCase().includes('json') ||
    file.mimeType?.toLowerCase().includes('csv') ||
    file.mimeType?.toLowerCase().includes('xml') ||
    file.mimeType?.toLowerCase().includes('html') ||
    file.originalName?.toLowerCase().match(/\.(txt|csv|json|xml|html|log)$/);

  const canPreview = isImage || isPdf || isText;

  const EmptyState = ({ title, message, onDownload }) => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: L.surface, borderRadius: 16, padding: 36, textAlign: 'center',
      border: `2px dashed ${L.border}`,
    }}>
      <DocumentTextIcon style={{ width: 46, height: 46, color: '#cbb789', marginBottom: 16 }} />
      <p style={{ fontSize: 15, fontWeight: 700, color: L.txt0, margin: '0 0 8px' }}>{title}</p>
      <p style={{ fontSize: 13, color: L.txt1, margin: '0 0 22px', maxWidth: 360 }}>{message}</p>
      <button
        onClick={onDownload}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10,
          background: L.accent, padding: '9px 18px', fontSize: 13, fontWeight: 700,
          color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.15s',
        }}
      >
        <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
        Download instead
      </button>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(40,32,18,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 920, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', borderRadius: 20, background: L.surface,
        boxShadow: '0 30px 80px rgba(120,98,53,0.30)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${L.border}`, background: L.surface, padding: '16px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11, background: L.accentL,
              border: `1px solid ${L.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <DocumentTextIcon style={{ width: 19, height: 19, color: L.accent }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: L.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.originalName}
              </h2>
              <p style={{ fontSize: 12, color: L.txt2, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.description || 'No description'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHov(true)}
            onMouseLeave={() => setCloseHov(false)}
            style={{
              display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center',
              borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
              background: closeHov ? 'rgba(212,175,122,0.14)' : 'transparent',
              color: closeHov ? L.txt0 : L.txt1,
            }}
          >
            <XMarkIcon style={{ width: 17, height: 17 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: L.surface2 }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  margin: '0 auto', width: 40, height: 40, borderRadius: '50%',
                  border: `4px solid ${L.border}`, borderTopColor: L.accent,
                  animation: 'sskatt-spin-pm 0.8s linear infinite',
                }} />
                <style>{`@keyframes sskatt-spin-pm { to { transform: rotate(360deg); } }`}</style>
                <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: L.txt1 }}>Loading preview...</p>
              </div>
            </div>
          )}

          {!loading && !previewError && (
            <>
              {/* Image Preview */}
              {isImage && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: L.surface, borderRadius: 16, padding: 16, border: `1px solid ${L.border}` }}>
                  <img
                    src={file.url}
                    alt={file.originalName}
                    style={{ maxHeight: 600, maxWidth: '100%', borderRadius: 10, objectFit: 'contain' }}
                    onError={() => setPreviewError(true)}
                  />
                </div>
              )}

              {/* PDF Preview */}
              {isPdf && (
                <div style={{ width: '100%', height: 700, borderRadius: 16, overflow: 'hidden', background: L.surface, border: `1px solid ${L.border}` }}>
                  <iframe
                    src={file.url}
                    style={{ width: '100%', height: '100%', border: 0 }}
                    title={file.originalName}
                    onError={() => setPreviewError(true)}
                  />
                </div>
              )}

              {/* Text Preview */}
              {isText && content && (
                <div style={{
                  background: L.codeBg, color: '#e8e1d4', padding: 18, borderRadius: 16,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12,
                  overflow: 'auto', maxHeight: 600, border: '1px solid rgba(212,175,122,0.18)',
                }}>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                    {content}
                  </pre>
                </div>
              )}

              {/* Unsupported Type */}
              {!canPreview && (
                <EmptyState
                  title={`Cannot preview ${file.originalName}`}
                  message="This file type cannot be previewed online. Please download it to view."
                  onDownload={downloadFile}
                />
              )}
            </>
          )}

          {previewError && (
            <EmptyState
              title="Could not load preview"
              message="There was an error loading the file preview."
              onDownload={downloadFile}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid ${L.border}`, background: L.surface, padding: '14px 24px',
        }}>
          <p style={{ fontSize: 12, color: L.txt2, margin: 0 }}>
            {file.size
              ? (() => {
                  const sizes = ['B', 'KB', 'MB', 'GB'];
                  let sizeIndex = 0;
                  let sizeValue = file.size;
                  while (
                    sizeValue >= 1024 &&
                    sizeIndex < sizes.length - 1
                  ) {
                    sizeValue /= 1024;
                    sizeIndex++;
                  }
                  return `${sizeValue.toFixed(1)} ${sizes[sizeIndex]}`;
                })()
              : 'Unknown size'}
          </p>
          <button
            onClick={downloadFile}
            onMouseEnter={() => setDlFooterHov(true)}
            onMouseLeave={() => setDlFooterHov(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10,
              border: `1px solid ${L.border}`, background: dlFooterHov ? L.accentL : L.surface,
              padding: '8px 16px', fontSize: 13, fontWeight: 700, color: L.txt1,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;