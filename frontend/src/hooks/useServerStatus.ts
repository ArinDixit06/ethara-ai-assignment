import { useState, useEffect, useCallback } from 'react';

export type ServerStatus = 'online' | 'offline' | 'checking';

export interface ServerStatusResult {
  status: ServerStatus;
  lastChecked: Date | null;
  latencyMs: number | null;
  retry: () => void;
}

const HEALTH_ENDPOINT =
  `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/health`.replace(
    /([^:])\/\/+/g,
    '$1/'
  );

// How often to poll in milliseconds
const POLL_INTERVAL_MS = 30_000; // 30 seconds
const REQUEST_TIMEOUT_MS = 8_000; // 8 seconds

export function useServerStatus(): ServerStatusResult {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const check = useCallback(async () => {
    setStatus((prev) => (prev === 'offline' ? 'checking' : prev));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const start = performance.now();

    try {
      const response = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - start);

      if (response.ok) {
        setStatus('online');
        setLatencyMs(elapsed);
      } else {
        setStatus('offline');
        setLatencyMs(null);
      }
    } catch {
      clearTimeout(timeoutId);
      setStatus('offline');
      setLatencyMs(null);
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  // Initial check + recurring poll
  useEffect(() => {
    check();
    const intervalId = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [check]);

  // Re-check when the browser tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [check]);

  return { status, lastChecked, latencyMs, retry: check };
}
