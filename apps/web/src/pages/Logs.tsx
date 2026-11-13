import { LogTimeline } from '../components/LogTimeline';

export default function Logs() {
  return <div className="space-y-4"><div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Verify</p><h1 className="mt-1 text-2xl font-semibold text-slate-100">Structured logs</h1><p className="mt-1 text-sm text-slate-500">Filterable events emitted through the shared logging contract.</p></div><LogTimeline /></div>;
}
