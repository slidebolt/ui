import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Zap,
  Code2,
  Search,
  Puzzle,
  KeyRound,
  Radio,
  Clapperboard,
  Menu,
  LogOut,
} from 'lucide-react';

type SessionUser = { id: string; username: string; role: string };

type Props = {
  user: SessionUser;
  onLogout: () => void;
};

const navItems = [
  { label: 'Dashboard', path: '/',        icon: LayoutDashboard },
  { label: 'Devices',   path: '/devices', icon: Server },
  { label: 'Entities',  path: '/entities',icon: Zap },
  { label: 'Scripts',   path: '/scripts', icon: Code2 },
  { label: 'Queries',   path: '/queries', icon: Search },
  { label: 'Plugins',   path: '/plugins', icon: Puzzle },
  { label: 'Tokens',    path: '/tokens',  icon: KeyRound },
  { label: 'Stream',    path: '/stream',  icon: Radio },
  { label: 'Media',     path: '/media',   icon: Clapperboard },
];

function Layout({ user, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    onLogout();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">

      {/* Sidebar */}
      <aside className={`flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-200 ${collapsed ? 'w-14' : 'w-56'}`}>

        {/* Brand */}
        <div className="flex items-center h-14 px-4 border-b border-slate-800 gap-3 overflow-hidden">
          <div className="w-5 h-5 rounded-sm bg-cyan-500 flex-shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-sm tracking-wide whitespace-nowrap text-slate-100">
              SlideBolt
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User / logout */}
        <div className="border-t border-slate-800 p-2">
          {!collapsed && (
            <div className="px-2.5 py-2 mb-1">
              <p className="text-xs text-slate-300 font-medium truncate">{user.username}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Log out"
            className="flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top nav */}
        <header className="flex-shrink-0 h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 gap-4">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-slate-400">{user.username}</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded text-xs capitalize">
              {user.role}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
