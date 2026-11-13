import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, Puzzle, Server, Zap } from 'lucide-react';
import { useCoreConnection, useEntities } from '../store/entityStore';
import { ComponentStatus, coreGet, DeviceEntry, isStale, LogEvent } from '../lib/core';
import { StatusBadge } from '../components/StatusBadge';

export default function Dashboard() {
  const inventory = useEntities();
  const entities = inventory.filter(e => e.key.split('.').length >= 3);
  const connection = useCoreConnection();
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [runtime, setRuntime] = useState<ComponentStatus[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  useEffect(() => {
    coreGet<DeviceEntry[]>('/devices').then(setDevices).catch(() => {});
    coreGet<ComponentStatus[]>('/runtime/components').then(setRuntime).catch(() => {});
    coreGet<LogEvent[]>('/logs?level=error&limit=10').then(setLogs).catch(() => {});
  }, []);
  const liveDevices = inventory.filter(entry => entry.key.split('.').length === 2) as unknown as DeviceEntry[];
  const visibleDevices = liveDevices.length ? liveDevices : devices;
  const plugins = runtime.filter(x => x.kind === 'plugin');
  const failures = runtime.filter(x => ['failed','stopped'].includes(x.state));
  const unhealthy = [...visibleDevices.map(d => ({ key: d.key, name: d.data.name, status: d.data.status, kind: 'device' })), ...entities.map(e => ({ key: e.key, name: e.data.name, status: e.data.status, kind: 'entity' }))].filter(x => x.status && (['degraded','unavailable','error'].includes(x.status.health) || isStale(x.status) === true));
  const cards = useMemo(() => [
    { label: 'Plugins', value: plugins.length, icon: Puzzle },
    { label: 'Devices', value: visibleDevices.length, icon: Server },
    { label: 'Entities', value: entities.length, icon: Zap },
    { label: 'Problems', value: failures.length + unhealthy.length, icon: AlertTriangle },
  ], [plugins.length, visibleDevices.length, entities.length, failures.length, unhealthy.length]);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Verify</p><h1 className="mt-1 text-2xl font-semibold text-slate-100">System overview</h1></div><div className="flex items-center gap-2 text-xs text-slate-500"><Activity className="h-4 w-4" />Event stream <StatusBadge value={connection} /></div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(({label,value,icon:Icon}) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"><div className="flex items-center justify-between text-xs text-slate-500"><span>{label}</span><Icon className="h-4 w-4" /></div><p className="mt-2 text-2xl font-semibold tabular-nums text-slate-100">{value}</p></div>)}</div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Panel title="Component runtime" action="Open explorer" to="/explore">{runtime.length === 0 ? <Empty text="Runtime status is unavailable." /> : runtime.map(item => <Link key={item.id} to={`/explore/plugin/${encodeURIComponent(item.id)}`} className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 last:border-0 hover:bg-slate-800/40"><span className="min-w-0 flex-1 truncate text-sm text-slate-300">{item.id}</span><span className="text-xs text-slate-600">{item.restartCount} restarts</span><StatusBadge value={item.state} /></Link>)}</Panel>
      <Panel title="Resources needing attention" action="Inspect inventory" to="/explore">{failures.length === 0 && unhealthy.length === 0 ? <Empty text="No reported failures or stale resources." /> : <>{failures.map(item => <Link key={item.id} to={`/explore/plugin/${encodeURIComponent(item.id)}`} className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 text-sm last:border-0 hover:bg-slate-800/40"><span className="flex-1 text-slate-300">{item.id}</span><StatusBadge value={item.state} /></Link>)}{unhealthy.slice(0, 15).map(item => <Link key={item.key} to={`/explore/${item.kind}/${encodeURIComponent(item.key)}`} className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 text-sm last:border-0 hover:bg-slate-800/40"><span className="min-w-0 flex-1 truncate text-slate-300">{item.name || item.key}</span><StatusBadge value={isStale(item.status) ? 'stale' : item.status?.health} /></Link>)}</>}</Panel>
      <div className="xl:col-span-2"><Panel title="Recent errors" action="Open logs" to="/logs">{logs.length === 0 ? <Empty text="No recent structured errors were returned." /> : logs.map(log => <div key={log.id} className="grid grid-cols-[90px_1fr_auto] gap-3 border-b border-slate-800 px-4 py-3 text-xs last:border-0"><time className="font-mono text-slate-600">{new Date(log.ts).toLocaleTimeString()}</time><span className="truncate text-slate-300">{log.message}</span><span className="text-slate-600">{log.plugin || log.source}</span></div>)}</Panel></div>
    </div>
  </div>;
}

function Panel({ title, action, to, children }: { title:string; action:string; to:string; children:ReactNode }) { return <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40"><header className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><h2 className="text-sm font-medium text-slate-200">{title}</h2><Link to={to} className="text-xs text-cyan-500 hover:text-cyan-300">{action}</Link></header>{children}</section>; }
function Empty({ text }: { text:string }) { return <p className="px-4 py-8 text-center text-sm text-slate-600">{text}</p>; }
