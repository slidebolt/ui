import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Setup } from './components/Setup';
import { CreateAdmin } from './components/CreateAdmin';
import { Login } from './components/Login';
import { CoreSync } from './components/CoreSync';
import Layout from './components/Layout';
import Devices from './pages/Devices';
import Entities from './pages/Entities';
import Scripts from './pages/Scripts';
import Queries from './pages/Queries';
import Plugins from './pages/Plugins';
import Tokens from './pages/Tokens';
import Stream from './pages/Stream';
import Media from './pages/Media';

type SetupStatus = { connected: boolean; coreApiUrl: string };
type UsersStatus = { hasUsers: boolean };
export type SessionUser = { id: string; username: string; role: string };

type BootState =
  | { phase: 'loading' }
  | { phase: 'no-token'; coreApiUrl: string }
  | { phase: 'no-users' }
  | { phase: 'no-session' }
  | { phase: 'ready'; user: SessionUser };

export default function App() {
  const [boot, setBoot] = useState<BootState>({ phase: 'loading' });

  useEffect(() => {
    (async () => {
      try {
        const setupRes = await fetch('/api/setup/status', { credentials: 'same-origin' });
        const setup: SetupStatus = await setupRes.json();
        if (!setup.connected) {
          setBoot({ phase: 'no-token', coreApiUrl: setup.coreApiUrl ?? 'http://127.0.0.1:29011' });
          return;
        }
        const usersRes = await fetch('/api/users/status', { credentials: 'same-origin' });
        const users: UsersStatus = await usersRes.json();
        if (!users.hasUsers) {
          setBoot({ phase: 'no-users' });
          return;
        }
        const meRes = await fetch('/api/me', { credentials: 'same-origin' });
        if (meRes.ok) {
          const me = await meRes.json();
          setBoot({ phase: 'ready', user: me.user });
        } else {
          setBoot({ phase: 'no-session' });
        }
      } catch {
        setBoot({ phase: 'loading' });
      }
    })();
  }, []);

  if (boot.phase === 'loading') return <Loading />;

  if (boot.phase === 'no-token')
    return (
      <Setup
        coreApiUrl={boot.coreApiUrl}
        onConnected={() => setBoot({ phase: 'no-users' })}
      />
    );

  if (boot.phase === 'no-users')
    return (
      <CreateAdmin
        onCreated={(u) => setBoot({ phase: 'ready', user: u })}
      />
    );

  if (boot.phase === 'no-session')
    return (
      <Login
        onLogin={(u) => setBoot({ phase: 'ready', user: u })}
      />
    );

  const { user } = boot;
  const logout = () => setBoot({ phase: 'no-session' });

  return (
    <BrowserRouter>
      <CoreSync />
      <Routes>
        <Route path="/" element={<Layout user={user} onLogout={logout} />}>
          <Route index element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="entities" element={<Entities />} />
          <Route path="scripts" element={<Scripts />} />
          <Route path="queries" element={<Queries />} />
          <Route path="plugins" element={<Plugins />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="stream" element={<Stream />} />
          <Route path="media" element={<Media />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Dashboard() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold">Overview</p>
        <h1 className="text-2xl font-semibold text-slate-100 mt-1">Dashboard</h1>
      </div>
      <p className="text-slate-500 text-sm">Select a section from the sidebar to get started.</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="text-slate-500 text-sm tracking-wide">Loading…</div>
    </div>
  );
}
