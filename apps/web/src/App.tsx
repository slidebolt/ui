import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Setup } from './components/Setup';
import { CreateAdmin } from './components/CreateAdmin';
import { Login } from './components/Login';
import { CoreSync } from './components/CoreSync';
import Layout from './components/Layout';
import PluginBrowser from './pages/PluginBrowser';
import CapabilityPage from './pages/CapabilityPage';

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
          <Route index element={<Navigate to="/live-tv" replace />} />
          <Route path="live-tv" element={<CapabilityPage kind="live-tv" />} />
          <Route path="libraries" element={<CapabilityPage kind="libraries" />} />
          <Route path="recordings" element={<CapabilityPage kind="recordings" />} />
          <Route path="sessions" element={<CapabilityPage kind="sessions" />} />
          <Route path="devices" element={<PluginBrowser />} />
          <Route path="plugins/:plugin" element={<PluginBrowser />} />
          <Route path="plugins/:plugin/:device" element={<PluginBrowser />} />
          <Route path="*" element={<Navigate to="/live-tv" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="text-slate-500 text-sm tracking-wide">Loading…</div>
    </div>
  );
}
