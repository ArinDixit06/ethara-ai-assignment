import React, { useState } from 'react';
import { useServerStatus } from '../../hooks/useServerStatus';

// ──────────────────────────────────────────────────────────────────────────────
// Inline styles (no Tailwind dependency – works with any setup)
// ──────────────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  /* Offline full-page overlay ------------------------------------------------ */
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  card: {
    textAlign: 'center',
    padding: '2.5rem 3rem',
    borderRadius: '1.5rem',
    background: 'rgba(30, 41, 59, 0.85)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    boxShadow:
      '0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
    maxWidth: '420px',
    width: '90vw',
    animation: 'slideUp 0.4s cubic-bezier(.16,1,.3,1)',
  },
  iconWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '2px solid rgba(239, 68, 68, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem',
  },
  title: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '0.5rem',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginBottom: '1.75rem',
    lineHeight: 1.6,
  },
  retryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1.5rem',
    borderRadius: '0.75rem',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.15s',
    boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '1rem',
    fontSize: '0.8rem',
    color: '#64748b',
  },

  /* Checking / connecting spinner ------------------------------------------- */
  spinnerWrap: {
    position: 'fixed',
    inset: 0,
    zIndex: 9998,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.92)',
    backdropFilter: 'blur(8px)',
  },
  spinnerText: {
    marginTop: '1rem',
    color: '#94a3b8',
    fontSize: '0.9rem',
    letterSpacing: '0.05em',
  },

  /* Online status pill (subtle top banner) ---------------------------------- */
  onlinePill: {
    position: 'fixed',
    bottom: '1.25rem',
    right: '1.25rem',
    zIndex: 9000,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    fontSize: '0.75rem',
    color: '#10b981',
    fontWeight: 500,
    backdropFilter: 'blur(8px)',
    transition: 'opacity 0.5s',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#10b981',
    animation: 'pulse 2s infinite',
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

const keyframesStyle = `
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

interface Props {
  /** Show a small green "Online" pill when the server is up. Default: true */
  showOnlinePill?: boolean;
  /** Block the entire UI while status is being checked. Default: true */
  blockOnChecking?: boolean;
}

export const ServerStatusBanner: React.FC<Props> = ({
  showOnlinePill = true,
  blockOnChecking = true,
}) => {
  const { status, lastChecked, latencyMs, retry } = useServerStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    retry();
    setTimeout(() => setIsRetrying(false), 2000);
  };

  const formattedTime = lastChecked
    ? lastChecked.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <>
      {/* Inject keyframes once */}
      <style>{keyframesStyle}</style>

      {/* ── CHECKING / CONNECTING STATE ──────────────────────────────────── */}
      {status === 'checking' && blockOnChecking && (
        <div style={{ ...styles.spinnerWrap, animation: 'fadeIn 0.3s ease' }}>
          {/* SVG spinner */}
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            style={{ animation: 'spin 0.8s linear infinite' }}
          >
            <circle
              cx="22"
              cy="22"
              r="18"
              stroke="#334155"
              strokeWidth="4"
            />
            <path
              d="M22 4 A18 18 0 0 1 40 22"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <p style={styles.spinnerText}>Connecting to server…</p>
        </div>
      )}

      {/* ── OFFLINE STATE ────────────────────────────────────────────────── */}
      {status === 'offline' && (
        <div style={styles.overlay}>
          <div style={styles.card}>
            {/* Icon */}
            <div style={styles.iconWrap}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
            </div>

            <h2 style={styles.title}>Server is Offline</h2>
            <p style={styles.subtitle}>
              We can't reach the backend server right now. It may be starting up
              (cold-start can take ~60 s on free plans) or experiencing an
              outage.
            </p>

            {/* Retry button */}
            <button
              style={{
                ...styles.retryBtn,
                opacity: isRetrying ? 0.7 : 1,
                transform: isRetrying ? 'scale(0.97)' : 'scale(1)',
              }}
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ animation: 'spin 0.7s linear infinite' }}
                  >
                    <path d="M21 12a9 9 0 1 1-9-9" />
                  </svg>
                  Retrying…
                </>
              ) : (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-3.04" />
                  </svg>
                  Retry Now
                </>
              )}
            </button>

            {/* Last checked timestamp */}
            {formattedTime && (
              <div style={styles.statusRow}>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Last checked at {formattedTime}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ONLINE PILL (bottom-right corner) ────────────────────────────── */}
      {status === 'online' && showOnlinePill && (
        <div style={styles.onlinePill}>
          <span style={styles.dot} />
          Online{latencyMs !== null ? ` · ${latencyMs}ms` : ''}
        </div>
      )}
    </>
  );
};

export default ServerStatusBanner;
