import { useState, useRef, useEffect, useCallback } from 'react';
import { useCoreEvents, CoreEvent } from '../hooks/useCoreEvents';

type StreamEvent = {
  id: number;
  ts: string;
  type: string;
  key: string;
  summary: string;
};

const MAX_EVENTS = 500;
const FLUSH_INTERVAL_MS = 5000;

let eventSeq = 0;

function summarise(event: CoreEvent): string {
  if (event.type === 'snapshot') return `snapshot — ${(event.items ?? []).length} items`;
  if (event.type === 'upsert' && event.data) {
    const d = event.data as Record<string, unknown>;
    const state = d.state as Record<string, unknown> | undefined;
    if (state) return Object.entries(state).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ');
    return 'upsert (no state)';
  }
  if (event.type === 'remove') return 'removed';
  return event.type;
}

export default function Stream() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [totalReceived, setTotalReceived] = useState(0);
  const buffer = useRef<StreamEvent[]>([]);
  const pausedRef = useRef(false);

  pausedRef.current = paused;

  // Flush buffer into state every 5s
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current || buffer.current.length === 0) return;
      const incoming = buffer.current.splice(0);
      setEvents(prev => {
        const combined = [...incoming, ...prev];
        return combined.length > MAX_EVENTS ? combined.slice(0, MAX_EVENTS) : combined;
      });
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const handleEvent = useCallback((event: CoreEvent) => {
    if (event.type === 'snapshot' || event.type === 'connected') return; // skip noise
    setTotalReceived(c => c + 1);
    if (pausedRef.current) return;
    buffer.current.push({
      id: ++eventSeq,
      ts: new Date().toISOString(),
      type: event.type,
      key: event.key ?? '—',
      summary: summarise(event),
    });
  }, []);

  useCoreEvents('>', handleEvent);

  const clear = () => {
    buffer.current = [];
    setEvents([]);
    setTotalReceived(0);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">Live</p>
          <h1 className="text-2xl font-semibold text-slate-100">Event Stream</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{totalReceived.toLocaleString()} received</span>
          <span className="text-xs text-slate-500">{events.length} shown (max {MAX_EVENTS})</span>
          <span className="text-xs text-slate-600">flushes every 5s</span>
          <button
            onClick={() => setPaused(p => !p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              paused
                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={clear}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 min-h-0">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-800 bg-slate-900">
              <th className="text-left px-4 py-2.5 text-slate-500 font-medium w-36">Time</th>
              <th className="text-left px-4 py-2.5 text-slate-500 font-medium w-20">Type</th>
              <th className="text-left px-4 py-2.5 text-slate-500 font-medium w-72">Key</th>
              <th className="text-left px-4 py-2.5 text-slate-500 font-medium">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-600">
                  {paused ? 'Paused — resume to see events' : 'Waiting for events…'}
                </td>
              </tr>
            ) : (
              events.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2 text-slate-600 font-mono whitespace-nowrap">
                    {e.ts.slice(11, 23)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      e.type === 'upsert' ? 'bg-cyan-500/10 text-cyan-400' :
                      e.type === 'remove' ? 'bg-red-500/10 text-red-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-400 font-mono truncate max-w-xs">{e.key}</td>
                  <td className="px-4 py-2 text-slate-500 font-mono truncate max-w-sm">{e.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
