import { useState } from 'react';
import { Activity, AlertTriangle, BookOpen, ChevronDown, ChevronUp, CircleDot, Play, Search, Settings2, X } from 'lucide-react';
import { coreCommand, coreGet, isStale } from '../lib/core';
import { commandDefinition, type CommandField } from '../lib/commands';
import { useEntity } from '../store/entityStore';

type Props = { entityKey: string; variant?: 'card' | 'row' };

export function EntityCard({ entityKey, variant = 'card' }: Props) {
  const entity = useEntity(entityKey);
  const [expanded, setExpanded] = useState(false);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  if (!entity) return null;

  const { data } = entity;
  const commands = data.commands ?? [];
  const state = data.state ?? {};
  const summary = stateSummary(data.type, state);
  const stale = isStale(data.status);

  const run = async (command: string, args: Record<string, unknown> = {}) => {
    const definition = commandDefinition(command);
    if (definition.risky && !window.confirm(`${definition.label} on ${data.name || data.id}?`)) return;
    setBusy(command); setMessage(null);
    try {
      await coreCommand(entityKey, command, args);
      setMessage({ kind: 'ok', text: `${definition.label} sent` });
      setActiveCommand(null);
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Command failed' });
    } finally {
      setBusy(null);
    }
  };

  const immediate = commands.filter(command => !(commandDefinition(command).fields?.length));
  const configured = commands.filter(command => commandDefinition(command).fields?.length);

  return <article className={`entity-card ${variant === 'row' ? 'entity-row-card' : ''}`}>
    <header className="flex items-start gap-3">
      <div className={`entity-icon ${data.status?.health === 'error' || data.status?.health === 'unavailable' ? 'entity-icon-error' : ''}`}><CircleDot className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-100">{data.name || data.id}</h3>
          <HealthDot health={stale ? 'stale' : data.status?.health} />
        </div>
        <p className="mt-0.5 truncate text-[11px] uppercase tracking-wide text-slate-500">{data.type || 'entity'}</p>
      </div>
    </header>

    <div className="mt-4 min-h-12">
      <p className="text-lg font-medium text-slate-200">{summary.primary}</p>
      {summary.secondary && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{summary.secondary}</p>}
    </div>

    {data.type === 'media_library' && <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setCatalogOpen(true)} className="control-button"><BookOpen className="h-3.5 w-3.5" />Browse library</button></div>}
    {commands.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">
      {immediate.map(command => <button key={command} disabled={busy !== null} onClick={() => run(command)} className="control-button">
        {busy === command ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}{commandDefinition(command).label}
      </button>)}
      {configured.map(command => <button key={command} disabled={busy !== null} onClick={() => setActiveCommand(command)} className="control-button"><Settings2 className="h-3.5 w-3.5" />{commandDefinition(command).label}</button>)}
    </div> : data.type !== 'media_library' && <p className="mt-4 text-xs text-slate-600">No commands advertised</p>}

    {message && <p className={`mt-3 rounded-md px-2 py-1.5 text-xs ${message.kind === 'ok' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{message.text}</p>}

    <button onClick={() => setExpanded(value => !value)} className="mt-4 flex w-full items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-500 hover:text-slate-300">
      <span className="truncate font-mono">{entityKey}</span>{expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
    </button>
    {expanded && <div className="mt-3 space-y-3">
      {data.status?.message && <p className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-200">{data.status.message}</p>}
      <pre className="raw-json">{JSON.stringify({ state: data.state, labels: data.labels, profile: data.profile, meta: data.meta }, null, 2)}</pre>
    </div>}

    {activeCommand && <CommandDialog command={activeCommand} state={state} busy={busy === activeCommand} onClose={() => setActiveCommand(null)} onRun={args => run(activeCommand, args)} />}
    {catalogOpen && <CatalogDialog provider={data.plugin} name={data.name || data.id} state={state} onClose={() => setCatalogOpen(false)} />}
  </article>;
}

type CatalogItem = { ref: { itemID: string }; kind: string; title: string; summary?: string; year?: number; season?: number; episode?: number };
type CatalogPage = { items: CatalogItem[] | null; total?: number; nextCursor?: string; error?: string };

function CatalogDialog({ provider, name, state, onClose }: { provider: string; name: string; state: Record<string, unknown>; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState<CatalogPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async (cursor = '') => {
    const server = String(state.serverID || '');
    const library = String(state.libraryID || '');
    if (!server || !library) { setError('Library is missing its server or library identifier.'); return; }
    setBusy(true); setError('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (query.trim()) params.set('query', query.trim());
      if (cursor) params.set('cursor', cursor);
      const next = await coreGet<CatalogPage>(`/media/catalog/${encodeURIComponent(provider)}/${encodeURIComponent(server)}/${encodeURIComponent(library)}?${params}`);
      if (next.error) throw new Error(next.error);
      setPage(current => cursor && current ? { ...next, items: [...(current.items ?? []), ...(next.items ?? [])] } : next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Catalog failed to load'); }
    finally { setBusy(false); }
  };
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-label={`Browse ${name}`} className="catalog-dialog">
      <header className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-cyan-400">Media library</p><h2 className="mt-1 text-lg font-semibold text-white">{name}</h2><p className="mt-1 text-xs text-slate-500">{String(state.kind || 'mixed')} · {String(page?.total ?? state.itemCount ?? 'unknown')} items</p></div><button onClick={onClose} className="icon-button"><X className="h-4 w-4" /></button></header>
      <form className="catalog-search" onSubmit={event => { event.preventDefault(); load(); }}><Search className="h-4 w-4" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search this library" /><button disabled={busy} className="primary-button">{busy ? 'Loading…' : 'Browse'}</button></form>
      {error && <p className="mt-4 rounded-md bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}
      {!page && !error && <button onClick={() => load()} className="catalog-empty"><BookOpen className="h-7 w-7" /><span>Load library contents</span></button>}
      {page && <div className="catalog-results">{(page.items ?? []).map(item => <article key={item.ref.itemID} className="catalog-item"><div className="min-w-0"><h3>{item.title}</h3><p>{item.kind}{item.year ? ` · ${item.year}` : ''}{item.season ? ` · S${item.season}E${item.episode || 0}` : ''}</p>{item.summary && <p className="catalog-summary">{item.summary}</p>}</div></article>)}{!(page.items ?? []).length && <p className="p-8 text-center text-sm text-slate-500">No matching items.</p>}</div>}
      {page?.nextCursor && <button disabled={busy} onClick={() => load(page.nextCursor)} className="secondary-button mt-4 w-full">{busy ? 'Loading…' : 'Load more'}</button>}
    </section>
  </div>;
}

function CommandDialog({ command, state, busy, onClose, onRun }: { command: string; state: Record<string, unknown>; busy: boolean; onClose: () => void; onRun: (args: Record<string, unknown>) => void }) {
  const definition = commandDefinition(command);
  const [values, setValues] = useState<Record<string, string | boolean>>(() => initialValues(definition.fields ?? [], state));
  const [error, setError] = useState('');
  const submit = () => {
    try {
      const args = buildArgs(definition.fields ?? [], values);
      setError(''); onRun(args);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid arguments'); }
  };
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-label={definition.label} className="command-dialog">
      <header className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-cyan-400">Entity command</p><h2 className="mt-1 text-lg font-semibold text-white">{definition.label}</h2><code className="text-xs text-slate-500">{command}</code></div><button onClick={onClose} className="icon-button"><X className="h-4 w-4" /></button></header>
      <div className="mt-5 space-y-4">{definition.fields?.map(field => <CommandFieldInput key={field.name} field={field} value={values[field.name] ?? ''} onChange={value => setValues(current => ({ ...current, [field.name]: value }))} />)}</div>
      {error && <p className="mt-4 flex gap-2 rounded-md bg-red-500/10 p-2 text-xs text-red-300"><AlertTriangle className="h-4 w-4" />{error}</p>}
      <footer className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="secondary-button">Cancel</button><button disabled={busy} onClick={submit} className="primary-button">{busy ? 'Sending…' : definition.label}</button></footer>
    </section>
  </div>;
}

function CommandFieldInput({ field, value, onChange }: { field: CommandField; value: string | boolean; onChange: (value: string | boolean) => void }) {
  if (field.kind === 'boolean') return <label className="flex items-center justify-between gap-4 text-sm text-slate-300"><span>{field.label}</span><input type="checkbox" checked={Boolean(value)} onChange={event => onChange(event.target.checked)} className="h-4 w-4 accent-cyan-500" /></label>;
  if (field.kind === 'select') return <label className="field-label"><span>{field.label}</span><select value={String(value)} onChange={event => onChange(event.target.value)} className="field-input">{field.options?.map(option => <option key={option}>{option}</option>)}</select></label>;
  if (field.kind === 'json') return <label className="field-label"><span>{field.label}</span><textarea rows={8} value={String(value)} onChange={event => onChange(event.target.value)} className="field-input font-mono text-xs" /></label>;
  return <label className="field-label"><span>{field.label}{field.optional ? ' (optional)' : ''}</span><input type={field.kind === 'number' ? 'number' : 'text'} min={field.min} max={field.max} step={field.step} value={String(value)} onChange={event => onChange(event.target.value)} className="field-input" /></label>;
}

function initialValues(fields: CommandField[], state: Record<string, unknown>): Record<string, string | boolean> {
  return Object.fromEntries(fields.map(field => {
    if (field.name === '$raw') return [field.name, '{}'];
    if (field.kind === 'json') return [field.name, field.name === 'segments' ? '[]' : '{}'];
    if (field.kind === 'boolean') return [field.name, Boolean(state[field.name])];
    if (field.kind === 'select') return [field.name, String(state[field.name] ?? field.options?.[0] ?? '')];
    return [field.name, state[field.name] === undefined ? '' : String(state[field.name])];
  }));
}

export function buildArgs(fields: CommandField[], values: Record<string, string | boolean>): Record<string, unknown> {
  if (fields.length === 1 && fields[0].name === '$raw') {
    const parsed = JSON.parse(String(values.$raw || '{}'));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Arguments must be a JSON object');
    return parsed as Record<string, unknown>;
  }
  const args: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.optional && value === '') continue;
    if (field.kind === 'json') args[field.name] = JSON.parse(String(value));
    else if (field.kind === 'number') {
      if (value === '') continue;
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) throw new Error(`${field.label} must be a number`);
      if (field.min !== undefined && numberValue < field.min || field.max !== undefined && numberValue > field.max) throw new Error(`${field.label} is outside the allowed range`);
      args[field.name] = numberValue;
    } else args[field.name] = value;
  }
  return args;
}

function stateSummary(type: string, state: Record<string, unknown>): { primary: string; secondary?: string } {
  const program = state.currentProgram as Record<string, unknown> | undefined;
  if (type === 'tv_channel') return { primary: `${state.number ?? ''} ${state.name ?? ''}`.trim() || 'Channel', secondary: program ? `${program.title ?? 'Unknown program'}${program.episodeTitle ? ` — ${program.episodeTitle}` : ''}` : String(state.guideError || 'No current guide data') };
  if (type === 'media_library') return { primary: String(state.kind ?? 'mixed'), secondary: `${state.itemCount ?? 'Unknown'} items${state.lastError ? ` · ${state.lastError}` : ''}` };
  if (type === 'recording_file' || type === 'tv_recording') return { primary: String(state.status ?? 'unknown'), secondary: String(state.relativePath ?? state.outputPath ?? state.path ?? '') || undefined };
  if (type === 'media_provider_connection') return { primary: String(state.status ?? 'unknown'), secondary: String(state.lastError ?? state.claimURL ?? '') || undefined };
  for (const key of ['power','state','value','status','position','temperature','available','connected']) if (state[key] !== undefined) return { primary: formatValue(state[key]), secondary: state.lastError ? String(state.lastError) : undefined };
  const keys = Object.keys(state);
  return { primary: keys.length ? `${keys.length} state fields` : 'No state', secondary: keys.slice(0, 4).join(' · ') || undefined };
}

function formatValue(value: unknown): string { if (typeof value === 'boolean') return value ? 'On' : 'Off'; if (typeof value === 'number') return value.toLocaleString(); return String(value); }
function HealthDot({ health }: { health?: string | null }) { const value = health || 'unknown'; return <span title={value} className={`health-dot health-${value}`} />; }
