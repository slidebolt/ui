import { useState, useCallback, useMemo } from 'react';
import { useCoreEvents, CoreEvent } from '../hooks/useCoreEvents';
import { 
  ChevronDown, 
  ChevronRight, 
  Puzzle, 
  Server, 
  Zap,
  LayoutGrid,
  Info,
  Database
} from 'lucide-react';

type EntityData = {
  id: string;
  name: string;
  plugin: string;
  deviceID: string;
  type: string;
};

type DeviceData = {
  id: string;
  name: string;
  plugin: string;
};

type Entity = { key: string; data: EntityData };
type Device = { key: string; data: DeviceData };

type PluginGroup = {
  name: string;
  deviceCount: number;
  entityCount: number;
  devices: string[];
  entities: string[];
};

export default function Plugins() {
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map());
  const [devices, setDevices] = useState<Map<string, Device>>(new Map());
  const [ready, setReady] = useState(false);
  const [expandedName, setExpandedName] = useState<string | null>(null);

  const handleEvent = useCallback((event: CoreEvent) => {
    if (event.type === 'snapshot' && event.items) {
      const eMap = new Map<string, Entity>();
      const dMap = new Map<string, Device>();
      
      for (const item of event.items) {
        if (item.key.startsWith('plugin-')) {
          const segments = item.key.split('.');
          if (segments.length >= 3) {
            eMap.set(item.key, item as Entity);
          } else if (segments.length === 2) {
            dMap.set(item.key, item as Device);
          }
        }
      }
      setEntities(eMap);
      setDevices(dMap);
      setReady(true);
    } else if (event.type === 'upsert' && event.key?.startsWith('plugin-')) {
      const segments = event.key.split('.');
      if (segments.length >= 3) {
        setEntities(prev => new Map(prev).set(event.key!, { key: event.key!, data: event.data as EntityData }));
      } else if (segments.length === 2) {
        setDevices(prev => new Map(prev).set(event.key!, { key: event.key!, data: event.data as DeviceData }));
      }
    } else if (event.type === 'remove' && event.key?.startsWith('plugin-')) {
      const segments = event.key.split('.');
      if (segments.length >= 3) {
        setEntities(prev => { const m = new Map(prev); m.delete(event.key!); return m; });
      } else if (segments.length === 2) {
        setDevices(prev => { const m = new Map(prev); m.delete(event.key!); return m; });
      }
    }
  }, []);

  useCoreEvents('>', handleEvent);

  const pluginGroups = useMemo(() => {
    const groups = new Map<string, PluginGroup>();
    
    // Process entities
    entities.forEach(e => {
      const pName = e.data.plugin || e.key.split('.')[0];
      if (!groups.has(pName)) {
        groups.set(pName, { name: pName, deviceCount: 0, entityCount: 0, devices: [], entities: [] });
      }
      const g = groups.get(pName)!;
      g.entityCount++;
      g.entities.push(e.key);
    });

    // Process devices
    devices.forEach(d => {
      const pName = d.data.plugin || d.key.split('.')[0];
      if (!groups.has(pName)) {
        groups.set(pName, { name: pName, deviceCount: 0, entityCount: 0, devices: [], entities: [] });
      }
      const g = groups.get(pName)!;
      g.deviceCount++;
      g.devices.push(d.key);
    });

    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [entities, devices]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">Core</p>
        <h1 className="text-2xl font-semibold text-slate-100">Plugins</h1>
      </div>

      {!ready && <p className="text-slate-500 text-sm">Connecting…</p>}

      {ready && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Plugin Name</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Devices</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Entities</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pluginGroups.map(g => (
                <PluginRow 
                  key={g.name} 
                  group={g} 
                  isExpanded={expandedName === g.name}
                  onToggle={() => setExpandedName(expandedName === g.name ? null : g.name)}
                />
              ))}
            </tbody>
          </table>
          {pluginGroups.length === 0 && (
            <p className="text-center text-slate-600 text-sm py-8">No plugins found.</p>
          )}
        </div>
      )}
    </div>
  );
}

function PluginRow({ group, isExpanded, onToggle }: { group: PluginGroup, isExpanded: boolean, onToggle: () => void }) {
  const cleanName = group.name.replace('plugin-', '');

  return (
    <>
      <tr 
        onClick={onToggle}
        className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/20' : ''}`}
      >
        <td className="px-4 py-3">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400">
              <Puzzle className="w-4 h-4" />
            </div>
            <span className="text-slate-200 font-medium capitalize">{cleanName}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Server className="w-3.5 h-3.5" />
            {group.deviceCount}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3.5 h-3.5" />
            {group.entityCount}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-4 py-6 bg-slate-900/60 border-y border-slate-800/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Plugin Overview */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Info className="w-4 h-4 text-cyan-500" />
                  Plugin Overview
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Devices</div>
                    <div className="text-2xl font-semibold text-slate-100">{group.deviceCount}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Entities</div>
                    <div className="text-2xl font-semibold text-slate-100">{group.entityCount}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                    <Server className="w-3 h-3" /> Registered Devices
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800/50 bg-slate-950/30 p-2">
                    {group.devices.length > 0 ? (
                      <ul className="space-y-1">
                        {group.devices.map(d => (
                          <li key={d} className="text-[10px] text-slate-400 font-mono truncate py-1 border-b border-slate-800/50 last:border-0">
                            {d}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[10px] text-slate-600 italic p-2 text-center">No explicit devices registered</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Data & Structure */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <LayoutGrid className="w-4 h-4 text-amber-500" />
                  Entity Map
                </div>
                
                <div className="space-y-4">
                   <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-800/50 bg-slate-950/30 p-2">
                      <ul className="space-y-1">
                        {group.entities.map(e => (
                          <li key={e} className="text-[10px] text-slate-400 font-mono truncate py-1 hover:text-cyan-400 transition-colors cursor-default">
                            {e}
                          </li>
                        ))}
                      </ul>
                   </div>

                   <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase font-bold px-1">
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3 h-3" />
                        Provider: {group.name}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
