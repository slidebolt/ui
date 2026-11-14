import { NavLink, Outlet } from 'react-router-dom';
import { Activity, BookOpen, Clapperboard, FileJson, History, LogOut, Radio, Server } from 'lucide-react';
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
      <header className="app-header"><div className="flex items-center gap-3"><span className="brand-mark" /><div><p className="text-sm font-semibold tracking-wide text-white">SlideBolt</p><p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">System console</p></div></div><nav className="app-nav"><NavItem to="/live-tv" icon={Radio} label="Live TV" /><NavItem to="/libraries" icon={BookOpen} label="Libraries" /><NavItem to="/recordings" icon={History} label="Recordings" /><NavItem to="/sessions" icon={Clapperboard} label="Sessions" /><NavItem to="/devices" icon={Server} label="Devices" /><NavItem to="/definitions" icon={FileJson} label="Definitions" /></nav><div className="ml-auto flex items-center gap-3"><span className={`connection-state connection-${connection}`}><Activity className="h-3.5 w-3.5" />{connection}</span><span className="hidden text-xs text-slate-400 sm:inline">{user.username}</span><button onClick={handleLogout} title="Log out" className="icon-button"><LogOut className="h-4 w-4" /></button></div></header>
      <div className="app-content"><Outlet /></div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: typeof Radio; label: string }) {
  return <NavLink to={to} className={({ isActive }) => `app-nav-item ${isActive ? 'active' : ''}`}><Icon className="h-3.5 w-3.5" /><span>{label}</span></NavLink>;
}

export default Layout;
