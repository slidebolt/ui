import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Boxes, ChevronLeft, Cpu, Puzzle, Search, Server } from 'lucide-react';
import { EntityCard } from '../components/EntityCard';
import { coreGetArray, type ComponentStatus, type DeviceEntry, isStale } from '../lib/core';
import { buildPluginInventory, entitiesForDevice, groupEntities } from '../lib/inventory';
import { useEntities } from '../store/entityStore';

export default function PluginBrowser() {
  const entities = useEntities().filter(entity => Boolean(entity.data.type && entity.data.plugin && entity.data.deviceID));
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [runtime, setRuntime] = useState<ComponentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { plugin: pluginParam, device: deviceParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      coreGetArray<DeviceEntry>('/devices', controller.signal),
      coreGetArray<ComponentStatus>('/runtime/components', controller.signal),
    ]).then(([nextDevices, nextRuntime]) => { setDevices(nextDevices); setRuntime(nextRuntime); })
      .catch(cause => { if (cause.name !== 'AbortError') setError(cause instanceof Error ? cause.message : 'Inventory failed to load'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const inventory = useMemo(() => buildPluginInventory(runtime, devices, entities), [runtime, devices, entities]);
  const requestedPlugin = pluginParam ? decodeURIComponent(pluginParam) : '';
  const selectedPlugin = inventory.find(item => item.id === requestedPlugin) ?? inventory[0];
  const requestedDevice = deviceParam ? decodeURIComponent(deviceParam) : '';
  const selectedDevice = selectedPlugin?.devices.find(item => item.key === requestedDevice) ?? selectedPlugin?.devices[0];
  const selectedEntities = useMemo(() => selectedDevice ? entitiesForDevice(selectedPlugin?.entities ?? [], selectedDevice).filter(entity => !isCapabilityEntity(entity.data.type)) : [], [selectedDevice, selectedPlugin, entities]);

  useEffect(() => {
    if (loading || !selectedPlugin) return;
    if (!pluginParam) return;
    const pluginChanged = requestedPlugin !== selectedPlugin.id;
    const deviceChanged = Boolean(deviceParam) && requestedDevice !== selectedDevice?.key;
    if (!pluginChanged && !deviceChanged) return;
    const canonical = deviceParam && selectedDevice ? `/plugins/${encodeURIComponent(selectedPlugin.id)}/${encodeURIComponent(selectedDevice.key)}` : `/plugins/${encodeURIComponent(selectedPlugin.id)}`;
    navigate(`${canonical}${location.search}`, { replace: true });
  }, [loading, selectedPlugin, selectedDevice, pluginParam, deviceParam, requestedPlugin, requestedDevice, navigate]);

  const pluginQuery = (searchParams.get('plugins') ?? '').toLowerCase();
  const deviceQuery = (searchParams.get('devices') ?? '').toLowerCase();
  const entityQuery = (searchParams.get('entities') ?? '').toLowerCase();
  const visiblePlugins = inventory.filter(item => !pluginQuery || `${item.id} ${item.runtime?.state}`.toLowerCase().includes(pluginQuery));
  const visibleDevices = (selectedPlugin?.devices ?? []).filter(item => !deviceQuery || `${item.data.name} ${item.data.id} ${item.key}`.toLowerCase().includes(deviceQuery));
  const visibleEntities = selectedEntities.filter(item => !entityQuery || `${item.data.name} ${item.data.id} ${item.data.type} ${item.key}`.toLowerCase().includes(entityQuery));
  const entityGroups = groupEntities(visibleEntities);
  const setQuery = (name: string, value: string) => { const next = new URLSearchParams(searchParams); value ? next.set(name, value) : next.delete(name); setSearchParams(next, { replace: true }); };
  const selectPlugin = (id: string) => navigate(`/plugins/${encodeURIComponent(id)}${location.search}`);
  const selectDevice = (key: string) => navigate(`/plugins/${encodeURIComponent(selectedPlugin!.id)}/${encodeURIComponent(key)}${location.search}`);

  if (loading) return <Centered icon={Cpu} title="Loading plugins" detail="Reading runtime, device, and entity inventory…" />;
  if (error && inventory.length === 0) return <Centered icon={AlertTriangle} title="Inventory unavailable" detail={error} />;
  if (inventory.length === 0) return <Centered icon={Puzzle} title="No plugins found" detail="No plugin runtime or inventory records were returned." />;

  return <div className={`plugin-browser ${pluginParam ? 'has-plugin' : ''} ${deviceParam ? 'has-device' : ''}`}>
    <aside className="browser-pane plugin-pane">
      <PaneHeader icon={Puzzle} title="Plugins" count={inventory.length} />
      <SearchBox value={searchParams.get('plugins') ?? ''} onChange={value => setQuery('plugins', value)} placeholder="Find a plugin" />
      <div className="pane-scroll">{visiblePlugins.map(item => <button key={item.id} onClick={() => selectPlugin(item.id)} className={`plugin-row ${item.id === selectedPlugin?.id ? 'selected' : ''}`}>
        <span className="row-icon"><Puzzle className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">{cleanPluginName(item.id)}</span><span className="mt-1 block text-[11px] text-slate-500">{item.devices.length} devices · {item.entities.length} entities{item.linkedEntityCount > 0 ? ` (${item.linkedEntityCount} linked)` : ''}</span></span><RuntimeState value={item.runtime?.state} />
      </button>)}</div>
    </aside>

    <aside className="browser-pane device-pane">
      <button className="mobile-back" onClick={() => navigate('/devices')}><ChevronLeft className="h-4 w-4" />Plugins</button>
      <PaneHeader icon={Server} title={cleanPluginName(selectedPlugin.id)} count={selectedPlugin.devices.length} subtitle="Devices" />
      <SearchBox value={searchParams.get('devices') ?? ''} onChange={value => setQuery('devices', value)} placeholder="Find a device" />
      <div className="pane-scroll">{visibleDevices.map(device => {
        const count = entitiesForDevice(selectedPlugin.entities, device).filter(entity => !isCapabilityEntity(entity.data.type)).length;
        const health = isStale(device.data.status) ? 'stale' : device.data.status?.health;
        return <button key={device.key} onClick={() => selectDevice(device.key)} className={`device-row ${device.key === selectedDevice?.key ? 'selected' : ''}`}>
          <span className="row-icon"><Server className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">{device.data.name || device.data.id}</span><span className="mt-1 block truncate font-mono text-[10px] text-slate-600">{device.data.id}</span></span><span className="flex flex-col items-end gap-1"><HealthLabel health={health} /><span className="text-[10px] text-slate-600">{count}</span></span>
        </button>;
      })}{visibleDevices.length === 0 && <EmptyPane text="No devices match." />}</div>
    </aside>

    <main className="workspace-pane">
      <button className="mobile-back" onClick={() => navigate(`/plugins/${encodeURIComponent(selectedPlugin.id)}`)}><ChevronLeft className="h-4 w-4" />Devices</button>
      {selectedDevice ? <>
        <DeviceSummary device={selectedDevice} entityCount={selectedEntities.length} pluginState={selectedPlugin.runtime?.state} />
        <div className="entity-toolbar"><div><p className="section-kicker">Entities</p><h2 className="text-xl font-semibold text-white">Controls and state</h2></div><div className="flex items-center gap-3"><span className="text-xs text-slate-500">{visibleEntities.length} of {selectedEntities.length}</span><SearchBox compact value={searchParams.get('entities') ?? ''} onChange={value => setQuery('entities', value)} placeholder="Filter entities" /></div></div>
        {visibleEntities.length > 0 ? <div className="entity-sections">{entityGroups.map(group => <section key={group.id} className="entity-section"><header className="entity-section-header"><div><p className="section-kicker">{group.kicker}</p><h3>{group.title}</h3></div><span className="count-badge">{group.entities.length}</span></header><div className="entity-grid">{group.entities.map(entity => <EntityCard key={entity.key} entityKey={entity.key} />)}</div></section>)}</div> : <div className="workspace-empty"><Boxes className="h-7 w-7" /><p>No entities match this device and filter.</p></div>}
      </> : <div className="workspace-empty"><Server className="h-8 w-8" /><p>This plugin has no devices.</p></div>}
    </main>
  </div>;
}

function DeviceSummary({ device, entityCount, pluginState }: { device: DeviceEntry; entityCount: number; pluginState?: string }) {
  const [raw, setRaw] = useState(false);
  const health = isStale(device.data.status) ? 'stale' : device.data.status?.health;
  return <section className="device-summary">
    <div className="flex min-w-0 flex-1 items-start gap-4"><div className="summary-icon"><Cpu className="h-6 w-6" /></div><div className="min-w-0"><p className="section-kicker">{cleanPluginName(device.data.plugin)}</p><h1 className="truncate text-2xl font-semibold text-white">{device.data.name || device.data.id}</h1><p className="mt-1 truncate font-mono text-xs text-slate-500">{device.key}</p><div className="mt-4 flex flex-wrap gap-2"><HealthLabel health={health} /><span className="summary-chip">{entityCount} entities</span><span className="summary-chip">Plugin {pluginState || 'unknown'}</span></div>{device.data.status?.message && <p className="mt-3 text-sm text-amber-300">{device.data.status.message}</p>}</div></div>
    <button onClick={() => setRaw(value => !value)} className="secondary-button">{raw ? 'Hide details' : 'Device details'}</button>
    {raw && <pre className="raw-json col-span-full mt-4">{JSON.stringify(device.data, null, 2)}</pre>}
  </section>;
}

function PaneHeader({ icon: Icon, title, subtitle, count }: { icon: typeof Puzzle; title: string; subtitle?: string; count: number }) { return <header className="pane-header"><span className="row-icon"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-white">{title}</h2>{subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}</div><span className="count-badge">{count}</span></header>; }
function SearchBox({ value, onChange, placeholder, compact = false }: { value: string; onChange: (value: string) => void; placeholder: string; compact?: boolean }) { return <label className={`search-box ${compact ? 'compact' : ''}`}><Search className="h-3.5 w-3.5" /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>; }
function RuntimeState({ value = 'unknown' }: { value?: string }) { return <span className={`runtime-state runtime-${value}`}><span />{value}</span>; }
function HealthLabel({ health = 'unknown' }: { health?: string | null }) { const value = health || 'unknown'; return <span className={`health-label health-label-${value}`}>{value}</span>; }
function EmptyPane({ text }: { text: string }) { return <p className="p-8 text-center text-xs text-slate-600">{text}</p>; }
function Centered({ icon: Icon, title, detail }: { icon: typeof Puzzle; title: string; detail: string }) { return <div className="flex h-full items-center justify-center p-8"><div className="max-w-sm text-center"><Icon className="mx-auto h-8 w-8 text-cyan-500" /><h1 className="mt-4 text-lg font-semibold text-white">{title}</h1><p className="mt-2 text-sm text-slate-500">{detail}</p></div></div>; }
function cleanPluginName(id: string) { return id.replace(/^plugin-/, '').replaceAll('-', ' '); }
function isCapabilityEntity(type: string) { return ['tv_channel', 'media_library', 'tv_recording', 'tv_recording_rule', 'recording_file', 'media_session'].includes(type); }
