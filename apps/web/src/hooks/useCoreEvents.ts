import { useEffect, useRef, useCallback } from 'react';

export type CoreEventType = 'connected' | 'snapshot' | 'upsert' | 'remove' | 'error' | 'close';

export type CoreEvent = {
  type: CoreEventType;
  key?: string;
  data?: unknown;
  items?: { key: string; data: unknown }[];
  pattern?: string;
  message?: string;
};

type Handler = (event: CoreEvent) => void;

/**
 * Subscribe to real-time Core API events via the UI's SSE proxy.
 *
 * @param pattern  Storage key pattern, e.g. "plugin-esphome.>" or ">" for everything
 * @param onEvent  Called for every event received (snapshot, upsert, remove)
 * @param enabled  Set false to skip connecting (e.g. while loading)
 */
export function useCoreEvents(pattern: string, onEvent: Handler, enabled = true) {
  const handlerRef = useRef<Handler>(onEvent);
  handlerRef.current = onEvent;

  const connect = useCallback(() => {
    const url = `/api/events?pattern=${encodeURIComponent(pattern)}`;
    const es = new EventSource(url, { withCredentials: true });

    const handle = (type: CoreEventType) => (e: MessageEvent) => {
      try {
        handlerRef.current({ ...JSON.parse(e.data), type });
      } catch {
        // ignore malformed frames
      }
    };

    es.addEventListener('connected', handle('connected'));
    es.addEventListener('snapshot', handle('snapshot'));
    es.addEventListener('upsert', handle('upsert'));
    es.addEventListener('remove', handle('remove'));
    es.addEventListener('error', handle('error'));
    es.addEventListener('close', handle('close'));

    es.onerror = () => {
      es.close();
      // Reconnect after 3s if the connection drops
      setTimeout(connect, 3000);
    };

    return es;
  }, [pattern]);

  useEffect(() => {
    if (!enabled) return;
    const es = connect();
    return () => es.close();
  }, [connect, enabled]);
}
