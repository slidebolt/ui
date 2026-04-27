import { useState, useMemo } from 'react';
import { useEntities, Entity as EntityType } from '../store/entityStore';
import { Entity } from '../components/Entity';
import { matchesQuery, QueryData } from '../utils/query-matcher';
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Database,
  Code2,
  Tag,
  Box,
  Layers
} from 'lucide-react';

function isQuery(key: string) {
  return key.startsWith('sb-query.queries.');
}

function hasQueryData(entity: EntityType): entity is EntityType & { data: QueryData } {
  return isQuery(entity.key) && typeof entity.data === 'object' && entity.data !== null && 'query' in entity.data;
}

export default function Queries() {
  const allEntities = useEntities();
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const queries = useMemo(
    () => allEntities.filter(hasQueryData),
    [allEntities]
  );

  const filtered = queries.filter(e => {
    const q = search.toLowerCase();
    return e.data?.name?.toLowerCase().includes(q) || e.key.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">Core</p>
          <h1 className="text-2xl font-semibold text-slate-100">Queries</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {filtered.length} queries · {allEntities.length} total entities
          </span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search queries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Name</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Key</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium text-right">Entities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map(e => (
              <QueryRow 
                key={e.key} 
                queryEntity={e} 
                allEntities={allEntities}
                isExpanded={expandedKey === e.key}
                onToggle={() => setExpandedKey(expandedKey === e.key ? null : e.key)}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-slate-600 text-sm py-8">No queries found.</p>
        )}
      </div>
    </div>
  );
}

function QueryRow({ queryEntity, allEntities, isExpanded, onToggle }: { 
  queryEntity: { key: string, data: QueryData }, 
  allEntities: EntityType[],
  isExpanded: boolean, 
  onToggle: () => void 
}) {
  const { data, key } = queryEntity;
  
  const matchedEntities = useMemo(() => {
    return allEntities.filter(ent => matchesQuery(ent.key, ent.data, data.query));
  }, [allEntities, data.query]);

  const count = matchedEntities.length;

  const condensedDefinition = useMemo(() => {
    const q = data.query;
    if (!q) return '—';
    const pattern = q.pattern || '>';
    const filters = q.where?.map(f => `${f.field} ${f.op} "${f.value}"`).join(' and ') || '';
    return filters ? `${pattern} where ${filters}` : pattern;
  }, [data.query]);

  return (
    <>
      <tr 
        onClick={onToggle}
        className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/20' : ''}`}
      >
        <td className="px-4 py-3">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </td>
        <td className="px-4 py-3 text-slate-200 font-medium">{data.name}</td>
        <td className="px-4 py-3 text-slate-500 font-mono text-[10px] truncate max-w-[300px]">
          {key}
        </td>
        <td className="px-4 py-3 text-right">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            count > 0 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-600'
          }`}>
            <Box className="w-3 h-3" />
            {count}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={4} className="px-4 py-6 bg-slate-900/60 border-y border-slate-800/50">
            <div className="space-y-6">
              {/* Condensed Definition Card */}
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  <Code2 className="w-4 h-4 text-cyan-500" />
                  Query Logic
                </div>
                <code className="text-xs font-mono text-cyan-400 bg-cyan-500/5 p-2 rounded border border-cyan-500/10 leading-relaxed break-all">
                  {condensedDefinition}
                </code>
              </div>

              {/* Entities List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Matched Entities
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{count} results</span>
                </div>
                
                <div className="grid gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {matchedEntities.map(ent => (
                    <Entity.Item key={ent.key} entityKey={ent.key}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <Entity.Icon className="w-4 h-4" />
                          <Entity.Name className="text-xs text-slate-200 font-medium" subtext="id" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Entity.Badge />
                          <Entity.State className="text-xs min-w-[60px] text-right" />
                        </div>
                      </div>
                    </Entity.Item>
                  ))}
                  {count === 0 && (
                    <div className="text-center py-8 text-slate-600 text-xs italic bg-slate-800/20 rounded-lg border border-dashed border-slate-800">
                      No entities match this query.
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="flex items-center gap-4 text-[10px] text-slate-600 uppercase font-bold px-1">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  Type: query
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className="w-3 h-3" />
                  Live Sync (Global Store)
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
