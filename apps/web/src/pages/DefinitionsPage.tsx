import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, ChevronDown, Search, ShieldCheck } from 'lucide-react';
import { coreGet } from '../lib/core';

type Definition = { type: string; name: string; description: string; schema: unknown; liveCount: number; producers?: string[] };
type Coverage = { total: number; resolved: number; unresolved: string[] };
type Plugin = { id: string; state: string; definitions?: { name: string; description: string; deviceClasses?: Array<{ class: string; name: string; description: string; entityTypes?: string[] }>; entityTypes?: string[]; commands?: Array<{ action: string; name: string; description: string }>; extensions?: Array<{ type: string; name: string; description: string }> }; observedEntityTypes?: string[]; definitionError?: string };
type Catalog = { schemaVersion: number; domain: { deviceSchema: unknown; entityTypes: Definition[]; commands: Definition[] }; plugins: Plugin[]; coverage: { devices: Coverage; entities: Coverage; commands: Coverage } };

export default function DefinitionsPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => { const controller = new AbortController(); coreGet<Catalog>('/definitions', controller.signal).then(setCatalog).catch(e => setError(String(e))); return () => controller.abort(); }, []);
  const types = useMemo(() => catalog?.domain.entityTypes.filter(item => `${item.type} ${item.name} ${item.description} ${(item.producers ?? []).join(' ')}`.toLowerCase().includes(query.toLowerCase())) ?? [], [catalog, query]);
  if (error) return <main className="capability-page"><div className="workspace-empty"><AlertTriangle/><p>{error}</p></div></main>;
  if (!catalog) return <main className="capability-page"><div className="workspace-empty"><p>Loading serialized definitions…</p></div></main>;
  const healthy = Object.values(catalog.coverage).every(section => section.unresolved.length === 0);
  return <main className="capability-page">
    <header className="capability-hero"><div className="summary-icon"><BookOpen className="h-6 w-6"/></div><div className="min-w-0 flex-1"><p className="section-kicker">Executable contract · schema v{catalog.schemaVersion}</p><h1>Definitions</h1><p>Domain contracts and plugin declarations serialized by the running code.</p></div><span className={`summary-chip ${healthy ? '' : 'definition-warning'}`}>{healthy ? <ShieldCheck className="h-4 w-4"/> : <AlertTriangle className="h-4 w-4"/>}{healthy ? 'fully resolved' : 'unresolved definitions'}</span></header>
    <section className="definition-coverage">{Object.entries(catalog.coverage).map(([name, value]) => <article key={name}><p className="section-kicker">{name}</p><strong>{value.resolved} / {value.total}</strong><span>{value.unresolved.length ? `${value.unresolved.length} unresolved` : 'all resolved'}</span>{value.unresolved.length > 0 && <details><summary>Show unresolved</summary><pre>{value.unresolved.join('\n')}</pre></details>}</article>)}</section>
    <section><header className="entity-toolbar"><div><p className="section-kicker">sb-domain</p><h2>Shared entity contracts</h2></div><label className="capability-search"><Search className="h-4 w-4"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter definitions"/></label></header><div className="definition-list">{types.map(item => <DefinitionCard key={item.type} item={item}/>)}</div></section>
    <section><header className="entity-toolbar"><div><p className="section-kicker">sb-domain</p><h2>Shared command contracts</h2></div><span className="count-badge">{catalog.domain.commands.length}</span></header><div className="definition-list">{catalog.domain.commands.map(item => <DefinitionCard key={item.type} item={item}/>)}</div></section>
    <section><header className="entity-toolbar"><div><p className="section-kicker">Manifests</p><h2>Plugin declarations</h2></div><span className="count-badge">{catalog.plugins.length}</span></header><div className="definition-list">{catalog.plugins.map(plugin => <article className="definition-card" key={plugin.id}><header><div><p className="section-kicker">{plugin.id}</p><h3>{plugin.definitions?.name ?? plugin.id}</h3></div><span className={`connection-state connection-${plugin.state}`}>{plugin.state}</span></header><p>{plugin.definitions?.description ?? plugin.definitionError}</p><dl><dt>Observed domain types</dt><dd>{plugin.observedEntityTypes?.join(', ') || 'None'}</dd><dt>Declared domain types</dt><dd>{plugin.definitions?.entityTypes?.join(', ') || 'None declared'}</dd><dt>Device classes</dt><dd>{plugin.definitions?.deviceClasses?.map(item => `${item.name}: ${item.description}`).join(' · ') || 'None declared'}</dd><dt>Plugin commands</dt><dd>{plugin.definitions?.commands?.map(item => `${item.action}: ${item.description}`).join(' · ') || 'None'}</dd><dt>Extensions</dt><dd>{plugin.definitions?.extensions?.map(item => `${item.type}: ${item.description}`).join(' · ') || 'None'}</dd></dl></article>)}</div></section>
  </main>;
}

function DefinitionCard({ item }: { item: Definition }) {
  return <article className="definition-card"><header><div><p className="section-kicker">{item.type}</p><h3>{item.name}</h3></div><span className="count-badge">{item.liveCount} live</span></header><p>{item.description}</p><dl><dt>Producers</dt><dd>{item.producers?.join(', ') || 'Not currently used'}</dd></dl><details><summary><ChevronDown className="h-4 w-4"/>Serialized JSON Schema</summary><pre>{JSON.stringify(item.schema, null, 2)}</pre></details></article>;
}
