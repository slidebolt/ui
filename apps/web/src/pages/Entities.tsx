import { useState, useMemo } from 'react';
import { useEntities } from '../store/entityStore';
import { Entity } from '../components/Entity';
import { useEntityContext } from '../components/Entity/EntityItem';
import { 
  ChevronDown, 
  ChevronRight, 
  Settings2, 
  Sliders, 
  Palette, 
  Info,
  Database,
  Search,
  Filter
} from 'lucide-react';
import { ChromePicker } from 'react-color';

function isEntity(key: string) {
  return key.startsWith('plugin-') && key.split('.').length >= 3;
}

export default function Entities() {
  const allEntities = useEntities();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const entities = useMemo(() => allEntities.filter(e => isEntity(e.key)), [allEntities]);
  const types = useMemo(() => [...new Set(entities.map(e => e.data?.type).filter(Boolean))].sort(), [entities]);

  const filtered = entities.filter(e => {
    const q = search.toLowerCase();
    const matchSearch =
      e.data?.name?.toLowerCase().includes(q) ||
      e.data?.plugin?.toLowerCase().includes(q) ||
      e.data?.type?.toLowerCase().includes(q);
    const matchType = !typeFilter || e.data?.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">Core</p>
          <h1 className="text-2xl font-semibold text-slate-100">Entities</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{filtered.length} of {entities.length}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search entities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Name</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Type</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Room</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium text-right">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map(e => (
              <EntityRow 
                key={e.key} 
                entityKey={e.key} 
                isExpanded={expandedKey === e.key}
                onToggle={() => setExpandedKey(expandedKey === e.key ? null : e.key)}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-slate-600 text-sm py-8">No entities found.</p>
        )}
      </div>
    </div>
  );
}

function EntityRow({ entityKey, isExpanded, onToggle }: { entityKey: string, isExpanded: boolean, onToggle: () => void }) {
  const sendCommand = async (command: string, args: any = {}) => {
    try {
      await fetch(`/api/core/entities/${encodeURIComponent(entityKey)}/command`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, args }),
      });
    } catch (err) {
      console.error('Failed to send command:', err);
    }
  };

  return (
    <Entity.Item entityKey={entityKey}>
      <EntityRowContent 
        isExpanded={isExpanded} 
        onToggle={onToggle} 
        sendCommand={sendCommand} 
      />
    </Entity.Item>
  );
}

function EntityRowContent({ isExpanded, onToggle, sendCommand }: any) {
  const { entity, ui } = useEntityContext();
  const { data } = entity;
  const state = data.state || {};

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
            <Entity.Icon className="w-4 h-4" />
            <Entity.Name className="text-slate-200 font-medium" subtext="plugin" />
          </div>
        </td>
        <td className="px-4 py-3">
          <Entity.Badge />
        </td>
        <td className="px-4 py-3 text-slate-400 text-xs">
          {data.labels?.Room?.[0] || data.labels?.Area?.[0] || '—'}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex items-center gap-2">
            <Entity.State className="text-xs" />
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-4 py-6 bg-slate-900/60 border-y border-slate-800/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Interactive Controls */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Settings2 className="w-4 h-4 text-cyan-500" />
                  Controls
                </div>
                
                <div className="grid gap-6 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  {/* Primary Toggle for light/switch */}
                  {(data.type === 'switch' || data.type === 'light') && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Power</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const isOn = ui.isActive;
                          sendCommand(isOn ? `${data.type}_turn_off` : `${data.type}_turn_on`);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                          ui.isActive 
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                      >
                        {ui.isActive ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  )}

                  {/* Brightness / Value Slider */}
                  {(state.brightness !== undefined || data.type === 'number') && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span className="flex items-center gap-1.5"><Sliders className="w-3 h-3" /> {state.brightness !== undefined ? 'Brightness' : 'Value'}</span>
                        <span className="text-cyan-400 font-mono">{state.brightness ?? state.value}%</span>
                      </div>
                      <input 
                        type="range"
                        min={state.min ?? 0}
                        max={state.max ?? 255}
                        value={state.brightness ?? state.value ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (state.brightness !== undefined) {
                            sendCommand('light_set_brightness', { brightness: val });
                          } else {
                            sendCommand('number_set_value', { value: val });
                          }
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                  )}

                  {/* Color Picker */}
                  {(state.rgb !== undefined || state.xy !== undefined) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                        <Palette className="w-3 h-3" /> Color
                      </div>
                      <div className="flex gap-4 items-start">
                        <ChromePicker 
                          color={state.rgb ? { r: state.rgb[0], g: state.rgb[1], b: state.rgb[2] } : '#fff'}
                          onChangeComplete={(color) => {
                            sendCommand('light_set_rgb', { r: color.rgb.r, g: color.rgb.g, b: color.rgb.b });
                          }}
                          disableAlpha
                          styles={{ default: { picker: { background: '#0f172a', border: '1px solid #1e293b' } } }}
                        />
                        <div className="flex-1 grid grid-cols-2 gap-2">
                           {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'].map(c => (
                             <button 
                               key={c}
                               onClick={() => {
                                 const r = parseInt(c.slice(1,3), 16);
                                 const g = parseInt(c.slice(3,5), 16);
                                 const b = parseInt(c.slice(5,7), 16);
                                 sendCommand('light_set_rgb', { r, g, b });
                               }}
                               className="h-8 rounded border border-white/10 hover:scale-105 transition-transform"
                               style={{ backgroundColor: c }}
                             />
                           ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Commands */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Available Commands</div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.commands?.map((cmd: string) => (
                        <button 
                          key={cmd}
                          onClick={() => sendCommand(cmd)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono border border-slate-700 transition-colors"
                        >
                          {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Info className="w-4 h-4 text-amber-500" />
                  Metadata
                </div>
                
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                        <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">ID</span>
                        <span className="text-xs text-slate-300 font-mono break-all">{data.id}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                        <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Device</span>
                        <span className="text-xs text-slate-300 font-mono break-all">{data.deviceID}</span>
                      </div>
                   </div>

                   <div className="space-y-2">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                       <Database className="w-3 h-3" /> Raw State
                     </div>
                     <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 overflow-x-auto max-h-48">
                        <pre className="text-[10px] text-slate-400 font-mono leading-relaxed">
                          {JSON.stringify(state, null, 2)}
                        </pre>
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-2">
                     {Object.entries(data.labels || {}).map(([key, vals]) => (
                       <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 border border-slate-700">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">{key}:</span>
                         <span className="text-[10px] text-cyan-400 font-medium">{(vals as string[]).join(', ')}</span>
                       </div>
                     ))}
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
