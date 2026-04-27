import { useState } from 'react';

type SetupProps = {
  coreApiUrl: string;
  onConnected: () => void;
};

export function Setup({ coreApiUrl, onConnected }: SetupProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const response = await fetch('/api/setup/connect', {
        method: 'POST',
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect');
      }

      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-400 font-semibold">Initial Setup</p>
          <h1 className="text-3xl font-bold tracking-tight">Connect to SlideBolt</h1>
          <p className="text-slate-400 text-sm">
            Enter the URL of your running SlideBolt instance to generate an access token and begin.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500 font-medium">Core API URL</label>
            <div className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono text-sm">
              {coreApiUrl}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500">
          This will create a new stateful token with full access scopes.
        </p>
      </div>
    </main>
  );
}
