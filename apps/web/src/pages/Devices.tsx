import { useEffect, useState } from 'react';

type Device = {
  key: string;
  data: {
    id: string;
    name: string;
    plugin: string;
    labels: Record<string, string[]>;
    profile?: { name: string; id: string };
  };
};

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/core/devices', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => setDevices(data))
      .catch(() => setError('Failed to load devices'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = devices.filter(d => {
    const q = search.toLowerCase();
    return (
      d.data.name?.toLowerCase().includes(q) ||
      d.data.plugin?.toLowerCase().includes(q) ||
      Object.values(d.data.labels ?? {}).flat().some(l => l.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">Core</p>
          <h1 className="text-2xl font-semibold text-slate-100">Devices</h1>
        </div>
        {!loading && <span className="text-sm text-slate-500">{filtered.length} of {devices.length}</span>}
      </div>

      <input
        type="text"
        placeholder="Search devices..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
      />

      {loading && <p className="text-slate-500 text-sm">Loading...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Plugin</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Area</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Room</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-500 font-medium">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(d => (
                <tr key={d.key} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-200 font-medium">{d.data.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs">{d.data.plugin?.replace('plugin-', '') ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{d.data.labels?.Area?.[0] ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{d.data.labels?.Room?.[0] ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{d.data.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-slate-600 text-sm py-8">No devices found.</p>
          )}
        </div>
      )}
    </div>
  );
}
