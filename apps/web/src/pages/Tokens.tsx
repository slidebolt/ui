import { useEffect, useState } from 'react';

type CoreToken = {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
};

export default function Tokens() {
  const [tokens, setTokens] = useState<CoreToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/core/tokens', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => setTokens(data))
      .catch(() => setError('Failed to load tokens'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">Core</p>
          <h1 className="text-2xl font-semibold text-slate-100">Access Tokens</h1>
        </div>
        {!loading && <span className="text-sm text-slate-500">{tokens.length} tokens</span>}
      </div>

      {loading && <p className="text-slate-500 text-sm">Loading...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Scopes</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tokens.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-200 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{t.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.scopes?.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-xs">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tokens.length === 0 && (
            <p className="text-center text-slate-600 text-sm py-8">No tokens found.</p>
          )}
        </div>
      )}
    </div>
  );
}
