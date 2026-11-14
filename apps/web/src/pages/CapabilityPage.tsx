import { useMemo, useState } from 'react';
import { BookOpen, Clapperboard, History, Radio, Search } from 'lucide-react';
import { EntityCard } from '../components/EntityCard';
import { useEntities, type Entity } from '../store/entityStore';

type Kind = 'live-tv' | 'libraries' | 'recordings' | 'sessions';

const definitions: Record<Kind, { title: string; kicker: string; detail: string; types: string[]; icon: typeof Radio }> = {
  'live-tv': { title: 'Live TV', kicker: 'Channels and guide', detail: 'Current programming and recording controls across every television provider.', types: ['tv_channel'], icon: Radio },
  libraries: { title: 'Libraries', kicker: 'Media catalog', detail: 'Browse and search provider libraries without treating catalog items as devices.', types: ['media_library'], icon: BookOpen },
  recordings: { title: 'Recordings', kicker: 'Schedules and recorders', detail: 'Generic recording rules, scheduled actions, and active recorder capabilities.', types: ['schedule', 'recording_rule', 'recorder'], icon: History },
  sessions: { title: 'Sessions', kicker: 'Active playback', detail: 'Current media sessions and player state.', types: ['media_session', 'media_player'], icon: Clapperboard },
};

export default function CapabilityPage({ kind }: { kind: Kind }) {
  const all = useEntities();
  const [query, setQuery] = useState('');
  const definition = definitions[kind];
  const entities = useMemo(() => all.filter(entity => definition.types.includes(entity.data.type) && matches(entity, query)), [all, definition.types, query]);
  const groups = useMemo(() => groupByProvider(entities), [entities]);
  const Icon = definition.icon;
  return <main className="capability-page">
    <header className="capability-hero"><div className="summary-icon"><Icon className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="section-kicker">{definition.kicker}</p><h1>{definition.title}</h1><p>{definition.detail}</p></div><span className="summary-chip">{entities.length} items</span></header>
    <label className="capability-search"><Search className="h-4 w-4" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Filter ${definition.title.toLowerCase()}`} /></label>
    {groups.length ? <div className="capability-groups">{groups.map(group => <section key={group.provider}><header className="capability-group-header"><div><p className="section-kicker">Provider</p><h2>{providerName(group.provider)}</h2></div><span className="count-badge">{group.entities.length}</span></header><div className={kind === 'live-tv' ? 'channel-list' : 'entity-grid'}>{group.entities.map(entity => <EntityCard key={entity.key} entityKey={entity.key} variant={kind === 'live-tv' ? 'row' : 'card'} />)}</div></section>)}</div> : <div className="workspace-empty"><Icon className="h-8 w-8" /><p>No matching {definition.title.toLowerCase()} entities.</p></div>}
  </main>;
}

function matches(entity: Entity, query: string) {
  if (!query.trim()) return true;
  const state = entity.data.state ?? {};
  return `${entity.data.name} ${entity.data.plugin} ${entity.data.type} ${state.number ?? ''} ${state.name ?? ''} ${JSON.stringify(state.currentProgram ?? {})}`.toLowerCase().includes(query.trim().toLowerCase());
}

function groupByProvider(entities: Entity[]) {
  const providers = new Map<string, Entity[]>();
  for (const entity of entities) providers.set(entity.data.plugin, [...(providers.get(entity.data.plugin) ?? []), entity]);
  return [...providers.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([provider, values]) => ({ provider, entities: values.sort(channelSort) }));
}

function channelSort(a: Entity, b: Entity) {
  const left = String(a.data.state?.number ?? a.data.name);
  const right = String(b.data.state?.number ?? b.data.name);
  return left.localeCompare(right, undefined, { numeric: true });
}

function providerName(value: string) { return value.replace(/^plugin-/, '').replaceAll('-', ' '); }
