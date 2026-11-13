import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { coreGet, LogEvent } from '../lib/core';

type Props = { plugin?: string; device?: string; entity?: string; traceID?: string; compact?: boolean };

export function LogTimeline({ plugin, device, entity, traceID, compact }: Props) {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [level, setLevel] = useState('');
  const [filters, setFilters] = useState({ source: '', kind: '', plugin: plugin ?? '', device: device ?? '', entity: entity ?? '', trace: traceID ?? '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    if (plugin || device || entity || traceID) setFilters(current => ({ ...current, plugin: plugin ?? '', device: device ?? '', entity: entity ?? '', trace: traceID ?? '' }));
  }, [plugin, device, entity, traceID]);
  const query = useMemo(() => {
    const q = new URLSearchParams({ limit: compact ? '50' : '200' });
    if (filters.source) q.set('source', filters.source);
    if (filters.kind) q.set('kind', filters.kind);
    if (filters.plugin) q.set('plugin', filters.plugin);
    if (filters.device) q.set('device', filters.device);
    if (filters.entity) q.set('entity', filters.entity);
    if (filters.trace) q.set('trace_id', filters.trace);
    if (level) q.set('level', level);
    return q.toString();
  }, [filters, level, compact]);

  const load = () => {
    setLoading(true); setError(null);
    coreGet<LogEvent[]>(`/logs?${query}`)
      .then(setEvents).catch(e => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [query]);

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <select value={level} onChange={e => setLevel(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200">
        <option value="">All levels</option><option value="error">Error</option><option value="warn">Warn</option><option value="info">Info</option><option value="debug">Debug</option>
      </select>
      {!compact && !plugin && <>
        {(['source','kind','plugin','device','entity'] as const).map(field => <input key={field} value={filters[field]} onChange={e => setFilters(current => ({ ...current, [field]: e.target.value }))} placeholder={field} aria-label={`Filter by ${field}`} className="min-w-28 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600" />)}
        <input value={filters.trace} onChange={e => setFilters(current => ({ ...current, trace: e.target.value }))} placeholder="trace ID" aria-label="Filter by trace ID" className="min-w-36 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600" />
      </>}
      <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
      <span className="ml-auto text-xs text-slate-500">{events.length} events</span>
    </div>
    {loading && <p className="py-6 text-center text-sm text-slate-500">Loading logs…</p>}
    {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
    {!loading && !error && events.length === 0 && <p className="py-8 text-center text-sm text-slate-600">No structured logs match this context.</p>}
    {!loading && events.length > 0 && <div className="overflow-hidden rounded-xl border border-slate-800">
      {events.map(event => <button key={event.id} onClick={() => setExpanded(expanded === event.id ? null : event.id)} className="block w-full border-b border-slate-800/70 px-3 py-2.5 text-left last:border-0 hover:bg-slate-800/40">
        <div className="flex items-start gap-2">
          {expanded === event.id ? <ChevronDown className="mt-0.5 h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="mt-0.5 h-3.5 w-3.5 text-slate-500" />}
          <time className="w-20 shrink-0 font-mono text-[11px] text-slate-600">{new Date(event.ts).toLocaleTimeString()}</time>
          <span className={`w-12 shrink-0 text-[11px] font-medium uppercase ${event.level === 'error' ? 'text-red-400' : event.level === 'warn' ? 'text-amber-400' : 'text-slate-500'}`}>{event.level}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-slate-300">{event.message}</span>
          {event.trace_id && <span className="font-mono text-[10px] text-slate-600">{event.trace_id.slice(0, 8)}</span>}
        </div>
        {expanded === event.id && <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-400">{JSON.stringify(event, null, 2)}</pre>}
      </button>)}
    </div>}
  </div>;
}
