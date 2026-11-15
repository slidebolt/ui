import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, BookOpen, ChevronLeft, Clapperboard, History, Image, Play, Radio, Search } from 'lucide-react';
import { EntityCard } from '../components/EntityCard';
import { coreGet } from '../lib/core';
import { useEntities, type Entity } from '../store/entityStore';

type Kind = 'live-tv' | 'libraries' | 'recordings' | 'sessions';
type Definition = { title: string; singular: string; kicker: string; detail: string; types: string[]; icon: typeof Radio };
const definitions: Record<Kind, Definition> = {
  'live-tv': { title: 'Live TV', singular: 'channel', kicker: 'Channels and guide', detail: 'Current programming and recording controls across every television provider.', types: ['tv_channel'], icon: Radio },
  libraries: { title: 'Libraries', singular: 'library', kicker: 'Media catalog', detail: 'Browse and search provider libraries without treating catalog items as devices.', types: ['media_library'], icon: BookOpen },
  recordings: { title: 'Recordings', singular: 'recording capability', kicker: 'Schedules and recorders', detail: 'Generic recording rules, scheduled actions, and active recorder capabilities.', types: ['schedule', 'recording_rule', 'recorder'], icon: History },
  sessions: { title: 'Sessions', singular: 'session or player', kicker: 'Active playback', detail: 'Current media sessions and player state.', types: ['media_session', 'media_player'], icon: Clapperboard },
};

export type CatalogItem = {
  ref: { provider: string; serverID: string; libraryID?: string; itemID: string };
  kind: string; title: string; playable?: boolean; durationMS?: number;
  metadata?: Record<string, unknown>; assets?: Array<{ kind: string; ref: string }> | null;
};
export type CatalogPage = { items: CatalogItem[]; total?: number; nextCursor?: string; error?: string };
type Artwork = { data: string; contentType: string };

export default function CapabilityPage({ kind }: { kind: Kind }) {
  const all = useEntities();
  const definition = definitions[kind];
  const { provider: providerParam, entity: entityParam, item: itemParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const entities = useMemo(() => all.filter(entity => definition.types.includes(entity.data.type)), [all, definition.types]);
  const providers = useMemo(() => groupByProvider(entities), [entities]);
  const requestedProvider = providerParam ? decodeURIComponent(providerParam) : '';
  const selectedProvider = providers.find(group => group.provider === requestedProvider) ?? providers[0];
  const requestedEntity = entityParam ? decodeURIComponent(entityParam) : '';
  const selectedEntity = selectedProvider?.entities.find(entity => entity.key === requestedEntity) ?? selectedProvider?.entities[0];
  const providerQuery = (searchParams.get('providers') ?? '').toLowerCase();
  const entityQuery = (searchParams.get('entities') ?? '').toLowerCase();
  const visibleProviders = providers.filter(group => !providerQuery || providerLabel(group.provider).includes(providerQuery));
  const visibleEntities = (selectedProvider?.entities ?? []).filter(entity => !entityQuery || entityText(entity).includes(entityQuery));
  const setQuery = (name: string, value: string) => { const next = new URLSearchParams(searchParams); value ? next.set(name, value) : next.delete(name); setSearchParams(next, { replace: true }); };

  if (providers.length === 0) return <EmptyPage definition={definition} />;
  const Icon = definition.icon;
  return <div className={`capability-browser ${providerParam ? 'has-provider' : ''} ${entityParam ? 'has-entity' : ''}`}>
    <aside className="browser-pane capability-provider-pane">
      <PaneHeader icon={Icon} title={definition.title} count={providers.length} subtitle="Providers" />
      <SearchBox value={searchParams.get('providers') ?? ''} onChange={value => setQuery('providers', value)} placeholder="Find a provider" />
      <div className="pane-scroll">{visibleProviders.map(group => <button key={group.provider} onClick={() => navigate(capabilityPath(kind, group.provider))} className={`capability-row ${group.provider === selectedProvider?.provider ? 'selected' : ''}`}>
        <span className="row-icon"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium capitalize">{providerLabel(group.provider)}</span><span className="mt-1 block text-[11px] text-slate-500">{group.entities.length} items</span></span><span className="count-badge">{group.entities.length}</span>
      </button>)}</div>
    </aside>
    <aside className="browser-pane capability-entity-pane">
      <button className="mobile-back" onClick={() => navigate(`/${kind}`)}><ChevronLeft className="h-4 w-4" />Providers</button>
      <PaneHeader icon={Icon} title={providerLabel(selectedProvider.provider)} count={selectedProvider.entities.length} subtitle={definition.title} />
      <SearchBox value={searchParams.get('entities') ?? ''} onChange={value => setQuery('entities', value)} placeholder={`Find a ${definition.singular}`} />
      <div className="pane-scroll">{visibleEntities.map(entity => <button key={entity.key} onClick={() => navigate(capabilityPath(kind, entity.data.plugin, entity.key))} className={`capability-row ${entity.key === selectedEntity?.key ? 'selected' : ''}`}>
        <span className="row-icon"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">{entity.data.name || entity.data.id}</span><span className="mt-1 block truncate text-[11px] text-slate-500">{entitySummary(entity)}</span></span><HealthDot health={entity.data.status?.health} />
      </button>)}</div>
    </aside>
    <main className="capability-workspace">
      <button className="mobile-back" onClick={() => navigate(capabilityPath(kind, selectedProvider.provider))}><ChevronLeft className="h-4 w-4" />{definition.title}</button>
      {selectedEntity ? kind === 'libraries' ? <LibraryWorkspace entity={selectedEntity} itemID={itemParam ? decodeURIComponent(itemParam) : ''} /> : <EntityWorkspace entity={selectedEntity} /> : <WorkspaceEmpty icon={Icon} text={`This provider has no ${definition.title.toLowerCase()}.`} />}
    </main>
  </div>;
}

function LibraryWorkspace({ entity, itemID }: { entity: Entity; itemID: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentItem = searchParams.get('parent') ?? '';
  if (!itemID) return <CatalogWorkspace entity={entity} />;
  const backPath = parentItem ? catalogItemPath(entity.data.plugin, entity.key, parentItem) : capabilityPath('libraries', entity.data.plugin, entity.key);
  return <MediaItemWorkspace entity={entity} itemID={itemID} backLabel={parentItem ? 'Back to show' : `Back to ${entity.data.name}`} onBack={() => navigate(backPath)} onSelect={(childID, showID) => navigate(`${catalogItemPath(entity.data.plugin, entity.key, childID)}?parent=${encodeURIComponent(showID)}`)} />;
}

function CatalogWorkspace({ entity }: { entity: Entity }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [page, setPage] = useState<CatalogPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const state = entity.data.state ?? {};
  const provider = entity.data.plugin;
  const server = String(state.serverID || '');
  const library = String(state.libraryID || '');
  const requestPage = async (cursor = '', requestedQuery = query) => {
    if (!server || !library) { setError('Library is missing its server or library identifier.'); return; }
    setBusy(true); setError('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (requestedQuery.trim()) params.set('query', requestedQuery.trim());
      if (cursor) params.set('cursor', cursor);
      const next = normalizeCatalogPage(await coreGet<CatalogPage | { items: CatalogItem[] | null; total?: number; nextCursor?: string; error?: string }>(`/media/catalog/${encodeURIComponent(provider)}/${encodeURIComponent(server)}/${encodeURIComponent(library)}?${params}`));
      if (next.error) throw new Error(next.error);
      setPage(current => cursor && current ? { ...next, items: [...current.items, ...next.items] } : next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Catalog failed to load'); }
    finally { setBusy(false); }
  };
  const urlQuery = searchParams.get('q') ?? '';
  useEffect(() => { setQuery(urlQuery); setPage(null); void requestPage('', urlQuery); }, [entity.key, urlQuery]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = (event: React.FormEvent) => { event.preventDefault(); const next = new URLSearchParams(searchParams); query.trim() ? next.set('q', query.trim()) : next.delete('q'); setSearchParams(next); };
  return <div className="media-workspace">
    <header className="media-workspace-header"><div className="summary-icon"><BookOpen className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="section-kicker">{providerLabel(provider)} · Media library</p><h1>{entity.data.name || entity.data.id}</h1><p>{String(state.kind || 'mixed')} · {String(page?.total ?? state.itemCount ?? 'unknown')} items</p></div>{busy && <span className="summary-chip">Loading…</span>}</header>
    <form className="catalog-search media-catalog-search" onSubmit={submit}><Search className="h-4 w-4" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search this library" /><button disabled={busy} className="primary-button">Search</button></form>
    {error && <p className="media-error"><AlertTriangle className="h-4 w-4" />{error}</p>}
    {!error && page && <><div className="catalog-results media-catalog-results">{page.items.map(item => <button key={item.ref.itemID} onClick={() => navigate(catalogItemPath(provider, entity.key, item.ref.itemID))} className="catalog-item catalog-item-button"><span className="catalog-item-icon"><Play className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-left"><strong>{item.title}</strong><small>{item.kind}{metadataSummary(item.metadata) ? ` · ${metadataSummary(item.metadata)}` : ''}</small><span>{description(item)}</span></span></button>)}{page.items.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No matching items.</p>}</div>{page.nextCursor && <button disabled={busy} onClick={() => void requestPage(page.nextCursor)} className="secondary-button mt-4 w-full">{busy ? 'Loading…' : 'Load more'}</button>}</>}
    {!page && !error && <WorkspaceEmpty icon={BookOpen} text="Loading library contents…" />}
  </div>;
}

function MediaItemWorkspace({ entity, itemID, backLabel, onBack, onSelect }: { entity: Entity; itemID: string; backLabel: string; onBack: () => void; onSelect: (childID: string, parentID: string) => void }) {
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [artwork, setArtwork] = useState('');
  const [error, setError] = useState('');
  const [children, setChildren] = useState<CatalogPage | null>(null);
  const [childrenBusy, setChildrenBusy] = useState(false);
  const [childrenError, setChildrenError] = useState('');
  const state = entity.data.state ?? {};
  const provider = entity.data.plugin;
  const server = String(state.serverID || '');
  const library = String(state.libraryID || '');
  const loadChildren = async (parentID: string, cursor = '', signal?: AbortSignal) => {
    setChildrenBusy(true); setChildrenError('');
    try {
      const next = normalizeCatalogPage(await coreGet<CatalogPage | { items: CatalogItem[] | null; total?: number; nextCursor?: string; error?: string }>(childCatalogPath(provider, server, library, parentID, cursor), signal));
      if (next.error) throw new Error(next.error);
      setChildren(current => cursor && current ? { ...next, items: [...current.items, ...next.items] } : next);
    } catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setChildrenError(cause instanceof Error ? cause.message : 'Episodes failed to load'); }
    finally { setChildrenBusy(false); }
  };
  useEffect(() => {
    const controller = new AbortController(); setItem(null); setArtwork(''); setError(''); setChildren(null); setChildrenError('');
    coreGet<CatalogItem>(`/media/catalog/${encodeURIComponent(provider)}/${encodeURIComponent(server)}/${encodeURIComponent(library)}/items/${encodeURIComponent(itemID)}`, controller.signal).then(next => {
      setItem(next);
      if ((next.assets ?? []).some(asset => asset.kind === 'thumbnail')) coreGet<Artwork>(`/media/artwork/${encodeURIComponent(provider)}/${encodeURIComponent(server)}/${encodeURIComponent(itemID)}/thumb`, controller.signal).then(art => setArtwork(`data:${art.contentType};base64,${art.data}`)).catch(() => undefined);
      if (next.kind === 'show') void loadChildren(next.ref.itemID, '', controller.signal);
    }).catch(cause => { if (cause.name !== 'AbortError') setError(cause instanceof Error ? cause.message : 'Media item failed to load'); });
    return () => controller.abort();
  }, [provider, server, library, itemID]);
  return <div className="media-workspace"><button className="workspace-back" onClick={onBack}><ChevronLeft className="h-4 w-4" />{backLabel}</button>{error && <p className="media-error"><AlertTriangle className="h-4 w-4" />{error}</p>}{!item && !error && <WorkspaceEmpty icon={Clapperboard} text="Loading media details…" />}{item && <><article className="media-item-detail">{artwork ? <img src={artwork} alt="" /> : <div className="media-artwork-placeholder"><Image className="h-10 w-10" /></div>}<div className="min-w-0"><p className="section-kicker">{item.kind}</p><h1>{item.title}</h1><p className="media-item-facts">{item.playable ? 'Playable' : 'Not playable'}{item.durationMS ? ` · ${formatDuration(item.durationMS)}` : ''}</p>{description(item) && <p className="media-item-description">{description(item)}</p>}<Metadata metadata={item.metadata} /></div></article>{item.kind === 'show' && <section className="mt-6"><header className="entity-section-header"><div><p className="section-kicker">Series contents</p><h2>Episodes</h2></div><span className="count-badge">{children?.total ?? children?.items.length ?? 0}</span></header>{childrenError && <p className="media-error"><AlertTriangle className="h-4 w-4" />{childrenError}</p>}{children ? <><div className="catalog-results media-catalog-results">{sortEpisodes(children.items).map(episode => <button key={episode.ref.itemID} onClick={() => onSelect(episode.ref.itemID, item.ref.itemID)} className="catalog-item catalog-item-button"><span className="catalog-item-icon"><Play className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-left"><strong>{episode.title}</strong><small>{episodeNumber(episode)}{episode.durationMS ? ` · ${formatDuration(episode.durationMS)}` : ''}</small><span>{description(episode)}</span></span></button>)}{children.items.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No episodes found.</p>}</div>{children.nextCursor && <button disabled={childrenBusy} onClick={() => void loadChildren(item.ref.itemID, children.nextCursor)} className="secondary-button mt-4 w-full">{childrenBusy ? 'Loading…' : 'Load more episodes'}</button>}</> : !childrenError && <WorkspaceEmpty icon={Clapperboard} text="Loading episodes…" />}</section>}</>}</div>;
}

function EntityWorkspace({ entity }: { entity: Entity }) { return <div className="media-workspace"><div className="media-entity-detail"><EntityCard entityKey={entity.key} /></div></div>; }
function Metadata({ metadata }: { metadata?: Record<string, unknown> }) { if (!metadata) return null; const entries = Object.entries(metadata).filter(([key, value]) => key !== 'description' && value !== null && value !== '' && typeof value !== 'object'); return entries.length ? <dl className="media-metadata">{entries.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl> : null; }
function EmptyPage({ definition }: { definition: Definition }) { const Icon = definition.icon; return <div className="capability-page"><header className="capability-hero"><div className="summary-icon"><Icon className="h-6 w-6" /></div><div><p className="section-kicker">{definition.kicker}</p><h1>{definition.title}</h1><p>{definition.detail}</p></div></header><WorkspaceEmpty icon={Icon} text={`No ${definition.title.toLowerCase()} are currently registered.`} /></div>; }
function WorkspaceEmpty({ icon: Icon, text }: { icon: typeof Radio; text: string }) { return <div className="workspace-empty"><Icon className="h-8 w-8" /><p>{text}</p></div>; }
function PaneHeader({ icon: Icon, title, subtitle, count }: { icon: typeof Radio; title: string; subtitle?: string; count: number }) { return <header className="pane-header"><span className="row-icon"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-white">{title}</h2>{subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}</div><span className="count-badge">{count}</span></header>; }
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="search-box"><Search className="h-3.5 w-3.5" /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>; }
function HealthDot({ health }: { health?: string | null }) { const value = health || 'unknown'; return <span title={value} className={`health-dot health-${value}`} />; }
function groupByProvider(entities: Entity[]) { const providers = new Map<string, Entity[]>(); for (const entity of entities) providers.set(entity.data.plugin, [...(providers.get(entity.data.plugin) ?? []), entity]); return [...providers.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([provider, values]) => ({ provider, entities: values.sort(entitySort) })); }
function entitySort(a: Entity, b: Entity) { return String(a.data.state?.number ?? a.data.name).localeCompare(String(b.data.state?.number ?? b.data.name), undefined, { numeric: true }); }
function entityText(entity: Entity) { return `${entity.data.name} ${entity.data.id} ${entity.data.type} ${JSON.stringify(entity.data.state ?? {})}`.toLowerCase(); }
function providerLabel(value: string) { return value.replace(/^plugin-/, '').replaceAll('-', ' '); }
function entitySummary(entity: Entity) { const state = entity.data.state ?? {}; if (entity.data.type === 'media_library') return `${state.kind ?? 'mixed'} · ${state.itemCount ?? 'unknown'} items`; if (entity.data.type === 'tv_channel') return `${state.number ?? ''} ${(state.currentProgram as Record<string, unknown> | undefined)?.title ?? 'No current program'}`.trim(); if (entity.data.type === 'media_session') return `${state.state ?? 'unknown'} · ${state.title ?? entity.data.name}`; if (entity.data.type === 'recording_rule') return `${state.enabled ? 'enabled' : 'disabled'} · ${(state.query as Record<string, unknown> | undefined)?.title ?? entity.data.name}`; return entity.data.type.replaceAll('_', ' '); }
function description(item: CatalogItem) { return typeof item.metadata?.description === 'string' ? item.metadata.description : ''; }
function metadataSummary(metadata?: Record<string, unknown>) { if (!metadata) return ''; return Object.entries(metadata).filter(([key, value]) => key !== 'description' && value !== null && typeof value !== 'object').slice(0, 3).map(([key, value]) => `${key}: ${String(value)}`).join(' · '); }
function formatDuration(ms: number) { const minutes = Math.round(ms / 60000); return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`; }
function episodeNumber(item: CatalogItem) { const season = Number(item.metadata?.season || 0); const episode = Number(item.metadata?.episode || 0); return season || episode ? `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}` : 'Episode'; }
function sortEpisodes(items: CatalogItem[]) { return [...items].sort((a, b) => Number(a.metadata?.season || 0) - Number(b.metadata?.season || 0) || Number(a.metadata?.episode || 0) - Number(b.metadata?.episode || 0) || a.title.localeCompare(b.title)); }
export function normalizeCatalogPage(page: CatalogPage | { items: CatalogItem[] | null; total?: number; nextCursor?: string; error?: string }): CatalogPage { return { ...page, items: Array.isArray(page.items) ? page.items : [] }; }
export function capabilityPath(kind: Kind, provider?: string, entity?: string) { return `/${kind}${provider ? `/${encodeURIComponent(provider)}` : ''}${entity ? `/${encodeURIComponent(entity)}` : ''}`; }
export function catalogItemPath(provider: string, entity: string, item: string) { return `${capabilityPath('libraries', provider, entity)}/items/${encodeURIComponent(item)}`; }
export function childCatalogPath(provider: string, server: string, library: string, parentID: string, cursor = '') { const params = new URLSearchParams({ parentID, kind: 'episode', limit: '200' }); if (cursor) params.set('cursor', cursor); return `/media/catalog/${encodeURIComponent(provider)}/${encodeURIComponent(server)}/${encodeURIComponent(library)}?${params}`; }
