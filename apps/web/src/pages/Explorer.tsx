import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Box, ChevronRight, Copy, Puzzle, Search, Server, Zap } from 'lucide-react';
import { useEntities } from '../store/entityStore';
import type { Entity } from '../store/entityStore';
import { ComponentStatus, coreGet, DeviceEntry } from '../lib/core';
import { ResourceBadges, StatusBadge } from '../components/StatusBadge';
import { LogTimeline } from '../components/LogTimeline';

type Selection = { kind: 'plugin' | 'device' | 'entity'; key: string };

export default function Explorer() {
  const inventory = useEntities();
  const entities = inventory.filter(e => e.key.split('.').length >= 3);
  const [fetchedDevices, setFetchedDevices] = useState<DeviceEntry[]>([]);
  const [runtime, setRuntime] = useState<ComponentStatus[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const route = useParams();
  const navigate = useNavigate();
  const search = params.get('q') ?? '';

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      coreGet<DeviceEntry[]>('/devices', controller.signal).then(setFetchedDevices),
      coreGet<ComponentStatus[]>('/runtime/components', controller.signal).then(setRuntime).catch(e => setRuntimeError(e.message)),
    ]).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const devices = useMemo(() => {
    const merged = new Map(fetchedDevices.map(d => [d.key, d]));
    inventory.filter(entry => entry.key.split('.').length === 2).forEach(entry => merged.set(entry.key, entry as unknown as DeviceEntry));
    return [...merged.values()];
  }, [fetchedDevices, inventory]);

  const plugins = useMemo(() => {
    const ids = new Set(runtime.filter(x => x.kind === 'plugin').map(x => x.id));
    devices.forEach(d => ids.add(d.data.plugin || d.key.split('.')[0]));
    entities.forEach(e => ids.add(e.data.plugin || e.key.split('.')[0]));
    return [...ids].sort();
  }, [runtime, devices, entities]);

  const selected: Selection | null = route.kind && route.key
    ? { kind: route.kind as Selection['kind'], key: decodeURIComponent(route.key) }
    : null;
  const q = search.toLowerCase();
  const filteredPlugins = plugins.filter(p => !q || p.toLowerCase().includes(q) || devices.some(d => d.data.plugin === p && `${d.data.name} ${d.key}`.toLowerCase().includes(q)) || entities.some(e => e.data.plugin === p && `${e.data.name} ${e.data.type} ${e.key}`.toLowerCase().includes(q)));
  const select = (kind: Selection['kind'], key: string) => navigate(`/explore/${kind}/${encodeURIComponent(key)}${search ? `?q=${encodeURIComponent(search)}` : ''}`);

  return <div className="space-y-4">
    <PageHeader title="Inventory explorer" detail={`${plugins.length} plugins · ${devices.length} devices · ${entities.length} entities`} />
    {runtimeError && <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">Runtime status unavailable: {runtimeError}. Inventory remains visible; component state is unknown.</div>}
    <div className="grid min-h-[620px] grid-cols-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="border-b border-slate-800 lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-800 p-3">
          <label className="relative block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={search} onChange={e => { const next = new URLSearchParams(params); e.target.value ? next.set('q', e.target.value) : next.delete('q'); setParams(next, { replace: true }); }} placeholder="Search keys, names and types" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none" /></label>
        </div>
        <div className="max-h-[560px] overflow-y-auto p-2">
          {loading && <p className="p-4 text-sm text-slate-500">Loading inventory…</p>}
          {filteredPlugins.map(plugin => <PluginTree key={plugin} plugin={plugin} devices={devices.filter(d => d.data.plugin === plugin || d.key.startsWith(`${plugin}.`))} entities={entities.filter(e => e.data.plugin === plugin || e.key.startsWith(`${plugin}.`))} runtime={runtime.find(r => r.id === plugin)} selected={selected} onSelect={select} />)}
          {!loading && filteredPlugins.length === 0 && <p className="p-6 text-center text-sm text-slate-600">No inventory matches.</p>}
        </div>
      </section>
      <section className="min-w-0 p-5">{selected ? <Details selection={selected} devices={devices} entities={entities} runtime={runtime} /> : <EmptySelection />}</section>
    </div>
  </div>;
}

function PluginTree({ plugin, devices, entities, runtime, selected, onSelect }: { plugin: string; devices: DeviceEntry[]; entities: Entity[]; runtime?: ComponentStatus; selected: Selection | null; onSelect: (kind: Selection['kind'], key: string) => void }) {
  const [open, setOpen] = useState(selected?.key === plugin || selected?.key.startsWith(`${plugin}.`));
  return <div className="mb-1">
    <div className={`flex items-center rounded-lg ${selected?.kind === 'plugin' && selected.key === plugin ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/60'}`}>
      <button aria-label={`${open ? 'Collapse' : 'Expand'} ${plugin}`} onClick={() => setOpen(!open)} className="p-2"><ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} /></button>
      <button onClick={() => onSelect('plugin', plugin)} className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left text-sm"><Puzzle className="h-4 w-4 text-cyan-500" /><span className="truncate font-medium">{plugin.replace('plugin-', '')}</span><span className="ml-auto"><StatusBadge value={runtime?.state} /></span></button>
    </div>
    {open && <div className="ml-5 border-l border-slate-800 pl-2">
      {devices.map(device => <div key={device.key}>
        <button onClick={() => onSelect('device', device.key)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${selected?.kind === 'device' && selected.key === device.key ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400 hover:bg-slate-800/60'}`}><Server className="h-3.5 w-3.5" /><span className="truncate">{device.data.name || device.data.id}</span><span className="ml-auto text-slate-600">{entities.filter(e => e.data.deviceID === device.data.id).length}</span></button>
        <div className="ml-4 border-l border-slate-800/70 pl-2">{entities.filter(e => e.data.deviceID === device.data.id).map(entity => <button key={entity.key} onClick={() => onSelect('entity', entity.key)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${selected?.kind === 'entity' && selected.key === entity.key ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-500 hover:bg-slate-800/60'}`}><Zap className="h-3 w-3" /><span className="truncate">{entity.data.name || entity.data.id}</span><span className="ml-auto truncate text-[10px] text-slate-600">{entity.data.type}</span></button>)}</div>
      </div>)}
      {devices.length === 0 && entities.map(entity => <button key={entity.key} onClick={() => onSelect('entity', entity.key)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-800/60"><Zap className="h-3 w-3" /><span className="truncate">{entity.data.name || entity.data.id}</span></button>)}
    </div>}
  </div>;
}

function Details({ selection, devices, entities, runtime }: { selection: Selection; devices: DeviceEntry[]; entities: Entity[]; runtime: ComponentStatus[] }) {
  const [tab, setTab] = useState<'details' | 'raw' | 'logs'>('details');
  const plugin = selection.kind === 'plugin' ? selection.key : selection.key.split('.')[0];
  const deviceID = selection.kind === 'device' ? selection.key.split('.').slice(1).join('.') : selection.kind === 'entity' ? entities.find(e => e.key === selection.key)?.data.deviceID : undefined;
  const entity = selection.kind === 'entity' ? entities.find(e => e.key === selection.key) : undefined;
  const device = selection.kind === 'device' ? devices.find(d => d.key === selection.key) : undefined;
  const component = runtime.find(r => r.id === plugin);
  const data: unknown = selection.kind === 'plugin' ? component ?? { id: plugin, state: 'unknown' } : selection.kind === 'device' ? device?.data : entity?.data;
  const title = selection.kind === 'plugin' ? plugin : selection.kind === 'device' ? device?.data.name || selection.key : entity?.data.name || selection.key;
  const status = selection.kind === 'device' ? device?.data.status : entity?.data.status;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start gap-3"><div className="rounded-lg bg-slate-800 p-2 text-cyan-400">{selection.kind === 'plugin' ? <Puzzle className="h-5 w-5" /> : selection.kind === 'device' ? <Server className="h-5 w-5" /> : <Zap className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-wider text-slate-500">{selection.kind}</p><h2 className="truncate text-xl font-semibold text-slate-100">{title}</h2><p className="mt-1 truncate font-mono text-xs text-slate-500">{selection.key}</p></div>{selection.kind === 'plugin' ? <StatusBadge value={component?.state} /> : <ResourceBadges status={status} />}</div>
    <div className="flex gap-1 border-b border-slate-800">{(['details','raw','logs'] as const).map(value => <button key={value} onClick={() => setTab(value)} className={`border-b-2 px-3 py-2 text-xs font-medium capitalize ${tab === value ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{value}</button>)}</div>
    {tab === 'details' && <DetailSummary selection={selection} data={data} devices={devices} entities={entities} component={component} />}
    {tab === 'raw' && <JsonView value={data} />}
    {tab === 'logs' && <LogTimeline plugin={plugin} device={deviceID} entity={entity?.data.id} />}
  </div>;
}

function DetailSummary({ selection, data, devices, entities, component }: { selection: Selection; data: unknown; devices: DeviceEntry[]; entities: Entity[]; component?: ComponentStatus }) {
  const record = (data ?? {}) as Record<string, any>;
  if (selection.kind === 'plugin') return <div className="space-y-5"><Facts values={{ State: component?.state ?? 'unknown', Kind: component?.kind ?? 'plugin', 'Contract version': component?.contractVersion ?? '—', Restarts: component?.restartCount ?? '—', Ready: component?.readyAt ? new Date(component.readyAt).toLocaleString() : '—', Dependencies: component?.dependencies?.join(', ') || '—' }} />{component?.lastError && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{component.lastError}</div>}<Related title="Devices" items={devices.filter(d => d.data.plugin === selection.key).map(d => ({ key: d.key, name: d.data.name }))} kind="device" /><Related title="Entities" items={entities.filter(e => e.data.plugin === selection.key).map(e => ({ key: e.key, name: e.data.name }))} kind="entity" /></div>;
  return <div className="space-y-5"><Facts values={{ Type: record.type ?? selection.kind, Plugin: record.plugin ?? '—', ID: record.id ?? '—', Health: record.status?.health ?? 'unknown', Observed: record.status?.observedAt ? new Date(record.status.observedAt).toLocaleString() : 'unknown', Commands: record.commands?.join(', ') || 'none advertised' }} />{record.status?.message && <p className="rounded-lg bg-slate-800/60 p-3 text-sm text-slate-300">{record.status.message}</p>}{selection.kind === 'device' && <Related title="Entities" items={entities.filter(e => e.data.plugin === record.plugin && e.data.deviceID === record.id).map(e => ({ key: e.key, name: e.data.name }))} kind="entity" />} {record.state !== undefined && <div><h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Current state</h3><JsonView value={record.state} /></div>}</div>;
}

function Facts({ values }: { values: Record<string, unknown> }) { return <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 sm:grid-cols-2">{Object.entries(values).map(([key, value]) => <div key={key} className="bg-slate-900 px-4 py-3"><dt className="text-[11px] uppercase tracking-wider text-slate-600">{key}</dt><dd className="mt-1 break-words text-sm text-slate-300">{String(value)}</dd></div>)}</dl>; }
function Related({ title, items, kind }: { title: string; items: {key:string;name:string}[]; kind: 'device'|'entity' }) { return <div><h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{title} ({items.length})</h3><div className="max-h-52 overflow-y-auto rounded-xl border border-slate-800">{items.map(x => <Link key={x.key} to={`/explore/${kind}/${encodeURIComponent(x.key)}`} className="flex items-center gap-2 border-b border-slate-800 px-3 py-2 text-sm text-slate-400 last:border-0 hover:bg-slate-800/50 hover:text-cyan-400"><Box className="h-3.5 w-3.5" /><span className="truncate">{x.name || x.key}</span><ChevronRight className="ml-auto h-3.5 w-3.5" /></Link>)}{items.length === 0 && <p className="p-4 text-center text-sm text-slate-600">None reported.</p>}</div></div>; }
function JsonView({ value }: { value: unknown }) { const text = JSON.stringify(value ?? null, null, 2); return <div className="relative"><button onClick={() => navigator.clipboard.writeText(text)} className="absolute right-2 top-2 rounded bg-slate-800 p-1.5 text-slate-500 hover:text-slate-200" aria-label="Copy JSON"><Copy className="h-3.5 w-3.5" /></button><pre className="max-h-[480px] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 pr-10 text-xs leading-5 text-slate-400">{text}</pre></div>; }
function EmptySelection() { return <div className="flex min-h-[520px] flex-col items-center justify-center text-center"><Puzzle className="mb-3 h-8 w-8 text-slate-700" /><h2 className="text-sm font-medium text-slate-400">Select a plugin, device, or entity</h2><p className="mt-1 max-w-sm text-xs text-slate-600">Inspect its status, complete data contract, relationships, and contextual logs.</p></div>; }
function PageHeader({ title, detail }: { title: string; detail: string }) { return <div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Verify</p><h1 className="mt-1 text-2xl font-semibold text-slate-100">{title}</h1></div><span className="text-xs text-slate-500">{detail}</span></div>; }
