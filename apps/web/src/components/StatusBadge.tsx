import type { ResourceStatus } from '../store/entityStore';
import { isStale } from '../lib/core';

const tones: Record<string, string> = {
  healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  running: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  degraded: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  starting: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  stale: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  disconnected: 'bg-red-500/10 text-red-400 border-red-500/20',
  connected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  unavailable: 'bg-red-500/10 text-red-400 border-red-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  stopped: 'bg-slate-800 text-slate-400 border-slate-700',
  unknown: 'bg-slate-800 text-slate-500 border-slate-700',
};

export function StatusBadge({ value = 'unknown' }: { value?: string }) {
  return <span className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-medium ${tones[value] ?? tones.unknown}`}>{value}</span>;
}

export function ResourceBadges({ status }: { status?: ResourceStatus }) {
  const stale = isStale(status);
  return <div className="flex items-center gap-1.5"><StatusBadge value={status?.health} />{stale === true && <StatusBadge value="stale" />}</div>;
}
