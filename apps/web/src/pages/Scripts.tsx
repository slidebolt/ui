import { useEffect, useState, useCallback, useMemo } from 'react';
import { useCoreEvents, CoreEvent } from '../hooks/useCoreEvents';
import { 
  ChevronDown, 
  ChevronRight, 
  Code2, 
  Play, 
  Activity, 
  Target,
  Clock,
  Zap
} from 'lucide-react';

type ScriptInstance = {
  name: string;
  hash: string;
  status: string;
  startedAt: string;
  lastFiredAt: string;
  fireCount: number;
  trigger?: {
    kind: string;
    [key: string]: any;
  };
  resolvedTargets?: string[];
};

type Script = {
  name: string;
  running: boolean;
  source?: string;
  instances: ScriptInstance[];
};

export default function Scripts() {
  const [scripts, setScripts] = useState<Map<string, Script>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const [expandedName, setExpandedName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/core/scripts', { credentials: 'same-origin' })
      .then(r => r.json())
      .then((data: Script[]) => setScripts(new Map(data.map(s => [s.name, s]))))
      .catch(() => setError('Failed to load scripts'))
      .finally(() => setLoading(false));
  }, []);

  const handleEvent = useCallback((event: CoreEvent) => {
    if (event.type === 'upsert' && event.key?.startsWith('sb-script.instances.')) {
      const instance = event.data as ScriptInstance;
      if (!instance?.name) return;
      setScripts(prev => {
        const m = new Map(prev);
        const existing = m.get(instance.name);
        if (!existing) return prev;
        const instances = [
          ...(existing.instances ?? []).filter(i => i.hash !== instance.hash),
          instance,
        ];
        m.set(instance.name, {
          ...existing,
          running: instances.some(i => i.status === 'running'),
          instances,
        });
        return m;
      });
      setLiveCount(c => c + 1);
    } else if (event.type === 'remove' && event.key?.startsWith('sb-script.instances.')) {
      const hash = event.key.split('.').at(-1);
      if (!hash) return;
      setScripts(prev => {
        const m = new Map(prev);
        for (const [name, script] of m) {
          const instances = script.instances.filter(i => i.hash !== hash);
          if (instances.length !== script.instances.length) {
            m.set(name, { ...script, running: instances.some(i => i.status === 'running'), instances });
            break;
          }
        }
        return m;
      });
    }
  }, []);

  useCoreEvents('sb-script.>', handleEvent, !loading);

  const all = useMemo(() => Array.from(scripts.values()), [scripts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">Core</p>
          <h1 className="text-2xl font-semibold text-slate-100">Scripts</h1>
        </div>
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {liveCount} updates
            </span>
          )}
          {!loading && <span className="text-sm text-slate-500">{all.length} scripts</span>}
        </div>
      </div>

      {loading && <p className="text-slate-500 text-sm">Loading…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Name</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Status</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Instances</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Fire Count</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Last Fired</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {all.map(s => (
                <ScriptRow 
                  key={s.name} 
                  script={s} 
                  isExpanded={expandedName === s.name}
                  onToggle={() => setExpandedName(expandedName === s.name ? null : s.name)}
                />
              ))}
            </tbody>
          </table>
          {all.length === 0 && (
            <p className="text-center text-slate-600 text-sm py-8">No scripts found.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ScriptRow({ script, isExpanded, onToggle }: { script: Script, isExpanded: boolean, onToggle: () => void }) {
  const activeInstances = script.instances?.filter(i => i.status === 'running') ?? [];
  const totalFires = script.instances?.reduce((sum, i) => sum + (i.fireCount ?? 0), 0) ?? 0;
  const lastFired = script.instances?.map(i => i.lastFiredAt).filter(Boolean).sort().at(-1);

  return (
    <>
      <tr 
        onClick={onToggle}
        className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/20' : ''}`}
      >
        <td className="px-4 py-3">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </td>
        <td className="px-4 py-3 text-slate-200 font-medium">{script.name}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            script.running ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
          }`}>
            {script.running && <Activity className="w-3 h-3 animate-pulse" />}
            {script.running ? 'running' : 'stopped'}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{activeInstances.length}</td>
        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{totalFires.toLocaleString()}</td>
        <td className="px-4 py-3 text-slate-500 text-xs">
          {lastFired ? new Date(lastFired).toLocaleString() : '—'}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-4 py-6 bg-slate-900/60 border-y border-slate-800/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Code2 className="w-4 h-4 text-cyan-500" />
                  Source Code
                </div>
                <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 overflow-x-auto">
                  <pre className="text-xs text-slate-300 font-mono leading-relaxed">
                    {script.source || '-- No source available'}
                  </pre>
                </div>
              </div>

              <div className="space-y-6">
                {script.instances && script.instances.length > 0 ? (
                  script.instances.map((instance) => (
                    <div key={instance.hash} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <Zap className="w-4 h-4 text-amber-500" />
                          Instance {instance.hash.slice(0, 8)}
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                          Started: {new Date(instance.startedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-slate-800/30 p-3 border border-slate-800/50">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold mb-2">
                            <Clock className="w-3 h-3" />
                            Trigger
                          </div>
                          <div className="text-xs text-slate-300">
                            {instance.trigger ? (
                              <div className="space-y-1">
                                <p className="font-semibold text-cyan-400">{instance.trigger.kind}</p>
                                {instance.trigger.minSeconds && (
                                  <p className="text-slate-500 text-[10px]">Interval: {instance.trigger.minSeconds}s</p>
                                )}
                              </div>
                            ) : 'Manual / Unknown'}
                          </div>
                        </div>

                        <div className="rounded-lg bg-slate-800/30 p-3 border border-slate-800/50">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold mb-2">
                            <Target className="w-3 h-3" />
                            Targets
                          </div>
                          <div className="text-xs text-slate-300 font-mono">
                            {instance.resolvedTargets?.length || 0} entities
                          </div>
                        </div>
                      </div>

                      {instance.resolvedTargets && instance.resolvedTargets.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Resolved Entities</div>
                          <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-800/50 bg-slate-900/40 p-2">
                            <ul className="space-y-1">
                              {instance.resolvedTargets.map(t => (
                                <li key={t} className="text-[10px] text-slate-400 font-mono truncate hover:text-slate-200 transition-colors">
                                  {t}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-600 space-y-2">
                    <Play className="w-8 h-8 opacity-20" />
                    <p className="text-sm">No active instances</p>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
