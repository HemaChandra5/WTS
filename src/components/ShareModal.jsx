import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon, LinkIcon, MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useFiles } from '../context/FilesContext';

const T = {
  surface: '#FFFFFF',
  bdr0: 'rgba(15,23,42,0.045)',
  bdr1: 'rgba(15,23,42,0.085)',
  txt0: '#0D1526',
  txt1: '#3D4F6B',
  txt2: '#7A8BA8',
  bg2: 'rgba(15,23,42,0.022)',
  accent: '#4F46E5',
  accentL: 'rgba(79,70,229,0.09)',
  accentB: 'rgba(79,70,229,0.22)',
  accentM: 'rgba(79,70,229,0.14)',
  emerald: '#10B981',
  emeraldL: 'rgba(16,185,129,0.09)',
  rose: '#DC2626',
};

const FONT = '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const ShareModal = ({ file, open, onClose, onShared }) => {
  const { fetchShareTargets, shareFileWithUsers } = useFiles();
  const [targets, setTargets] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [closeHov, setCloseHov] = useState(false);
  const [cancelHov, setCancelHov] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  useEffect(() => {
    if (!open || !file) {
      setTargets([]); setQuery([]); setSelectedIds([]);
      setError(''); setSuccessMessage('');
      return;
    }
    const load = async () => {
      setLoadingTargets(true); setError('');
      const result = await fetchShareTargets();
      if (!result?.success) { setError(result?.error || 'Failed to load users'); setTargets([]); }
      else { setTargets(Array.isArray(result.users) ? result.users : []); }
      setLoadingTargets(false);
    };
    load();
  }, [open, file, fetchShareTargets]);

  if (!open || !file) return null;

  const shareUrl = file.url || `${window.location.origin}/files/${file.id}`;

  const filteredTargets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return targets;
    return targets.filter((u) =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  }, [targets, query]);

  const toggleUser = (id) => {
    const s = String(id);
    setSelectedIds((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    if (!selectedIds.length || !file?.id) { setError('Select at least one user to share with.'); return; }
    setSharing(true); setError(''); setSuccessMessage('');
    const result = await shareFileWithUsers(file.id, selectedIds);
    setSharing(false);
    if (!result?.success) { setError(result?.error || 'Failed to share file'); return; }
    const msg = `Shared with ${selectedIds.length} user${selectedIds.length > 1 ? 's' : ''} successfully.`;
    setSuccessMessage(msg);
    onShared?.(msg);
    setSelectedIds([]);
  };

  const initials = (name = '') => name.trim().split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const grads = [
    'linear-gradient(135deg,#4F46E5,#7C3AED)',
    'linear-gradient(135deg,#0E84A5,#3454D1)',
    'linear-gradient(135deg,#0E9F6E,#0E84A5)',
    'linear-gradient(135deg,#D97706,#C23552)',
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(13,21,38,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        fontFamily: FONT,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90vw', maxWidth: 430, borderRadius: 20, background: T.surface,
          padding: '22px', boxShadow: '0 32px 80px rgba(13,21,38,0.28), 0 8px 24px rgba(13,21,38,0.08)',
          border: `1px solid ${T.bdr1}`,
          animation: 'smIn 0.22s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <style>{`@keyframes smIn { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>

        {/* Header */}
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, background: T.accentL,
              border: '1px solid rgba(79,70,229,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <LinkIcon style={{ width: 16, height: 16, color: T.accent }} />
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.txt0, margin: 0, letterSpacing: '-0.015em' }}>
                Share document
              </h2>
              <p style={{ marginTop: 2, fontSize: 11.5, color: T.txt2, lineHeight: 1.5, fontWeight: 500 }}>
                Share securely with specific people
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHov(true)} onMouseLeave={() => setCloseHov(false)}
            style={{
              borderRadius: '50%', border: 'none', padding: 7,
              color: T.txt1, cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
              background: closeHov ? 'rgba(15,23,42,0.07)' : 'transparent',
            }}
          >
            <XMarkIcon style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* File info */}
        <div style={{
          borderRadius: 12, background: T.bg2, border: `1px solid ${T.bdr0}`,
          padding: '11px 14px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LinkIcon style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: T.txt0, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.originalName}
            </span>
          </div>
          {file.description && (
            <p style={{ marginTop: 5, fontSize: 11.5, color: T.txt2, marginBottom: 0 }}>
              {file.description}
            </p>
          )}
        </div>

        {/* Link copy */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginBottom: 6, display: 'block', fontSize: 11, fontWeight: 700, color: T.txt2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Shareable link
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text" readOnly value={shareUrl}
              style={{
                flex: 1, borderRadius: 10, border: `1px solid ${T.bdr1}`,
                padding: '8px 12px', fontSize: 11.5, color: T.txt2,
                background: T.bg2, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={copyLink}
              style={{
                borderRadius: 10, background: copied ? T.emerald : T.accent,
                padding: '8px 16px', fontSize: 11.5, fontWeight: 700, color: '#fff',
                border: 'none', cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                boxShadow: copied ? '0 4px 12px rgba(16,185,129,0.30)' : '0 4px 12px rgba(79,70,229,0.28)',
                transform: copied ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* User search */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ marginBottom: 6, display: 'block', fontSize: 11, fontWeight: 700, color: T.txt2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Share with users {selectedIds.length > 0 && (
              <span style={{
                background: T.accent, color: '#fff',
                borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 800,
                marginLeft: 6,
              }}>
                {selectedIds.length}
              </span>
            )}
          </label>

          <div style={{ position: 'relative', marginBottom: 8 }}>
            <MagnifyingGlassIcon style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              width: 13, height: 13, color: T.txt2,
            }} />
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or role…"
              onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
              style={{
                width: '100%', borderRadius: 10,
                border: `1px solid ${searchFocus ? T.accentB : T.bdr1}`,
                padding: '8px 10px 8px 32px', fontSize: 12, color: T.txt0,
                background: '#fff', outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: searchFocus ? `0 0 0 3px ${T.accentL}` : 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{
            maxHeight: 190, overflowY: 'auto',
            border: `1px solid ${T.bdr1}`, borderRadius: 12, background: '#fff',
          }}>
            {loadingTargets && (
              <div style={{ padding: '14px 12px', fontSize: 12, color: T.txt2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: `2px solid ${T.bdr1}`, borderTopColor: T.accent,
                  animation: 'smSpin 0.7s linear infinite',
                }} />
                <style>{`@keyframes smSpin{to{transform:rotate(360deg)}}`}</style>
                Loading users…
              </div>
            )}

            {!loadingTargets && filteredTargets.length === 0 && (
              <div style={{ padding: '24px 12px', fontSize: 12, color: T.txt2, textAlign: 'center' }}>
                <UserGroupIcon style={{ width: 22, height: 22, margin: '0 auto 6px', opacity: 0.35 }} />
                No users found.
              </div>
            )}

            {!loadingTargets && filteredTargets.map((user) => {
              const checked = selectedIds.includes(String(user.id));
              const grad = grads[user.name?.charCodeAt(0) % 4 || 0];
              return (
                <label
                  key={user.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderBottom: `1px solid ${T.bdr0}`, cursor: 'pointer',
                    background: checked ? T.accentL : 'transparent',
                    transition: 'background 0.13s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: grad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {initials(user.name || user.email)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: T.txt0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || user.email}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: 11, color: T.txt2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email} · {(user.role || 'user').toUpperCase()}
                    </p>
                  </div>
                  <input
                    type="checkbox" checked={checked} onChange={() => toggleUser(user.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: 'pointer', accentColor: T.accent, width: 15, height: 15 }}
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <p style={{ marginBottom: 10, fontSize: 12, color: T.rose, fontWeight: 600, animation: 'smMsg 0.18s ease-out' }}>
            {error}
          </p>
        )}
        {successMessage && (
          <p style={{ marginBottom: 10, fontSize: 12, color: T.emerald, fontWeight: 600, animation: 'smMsg 0.18s ease-out' }}>
            {successMessage}
          </p>
        )}
        <style>{`@keyframes smMsg{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button" onClick={onClose}
            onMouseEnter={() => setCancelHov(true)} onMouseLeave={() => setCancelHov(false)}
            style={{
              borderRadius: 10, border: `1px solid ${T.bdr1}`,
              background: cancelHov ? T.bg2 : '#fff',
              padding: '9px 16px', fontSize: 12.5, fontWeight: 700, color: T.txt1,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={sharing || !selectedIds.length}
            onClick={handleShare}
            style={{
              borderRadius: 10, border: 'none',
              background: sharing || !selectedIds.length ? 'rgba(79,70,229,0.35)' : T.accent,
              padding: '9px 18px', fontSize: 12.5, fontWeight: 700, color: '#fff',
              cursor: sharing || !selectedIds.length ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
              boxShadow: sharing || !selectedIds.length ? 'none' : '0 4px 14px rgba(79,70,229,0.30)',
            }}
          >
            {sharing ? 'Sharing…' : `Share${selectedIds.length ? ` (${selectedIds.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;