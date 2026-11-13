import { Outlet } from 'react-router-dom';
import { Activity, LogOut } from 'lucide-react';
import { useCoreConnection } from '../store/entityStore';

type SessionUser = { id: string; username: string; role: string };

type Props = {
  user: SessionUser;
  onLogout: () => void;
};

function Layout({ user, onLogout }: Props) {
  const connection = useCoreConnection();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    onLogout();
  };

  return (
    <div className="app-shell">
      <header className="app-header"><div className="flex items-center gap-3"><span className="brand-mark" /><div><p className="text-sm font-semibold tracking-wide text-white">SlideBolt</p><p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Plugin console</p></div></div><div className="ml-auto flex items-center gap-3"><span className={`connection-state connection-${connection}`}><Activity className="h-3.5 w-3.5" />{connection}</span><span className="hidden text-xs text-slate-400 sm:inline">{user.username}</span><button onClick={handleLogout} title="Log out" className="icon-button"><LogOut className="h-4 w-4" /></button></div></header>
      <div className="app-content"><Outlet /></div>
    </div>
  );
}

export default Layout;
