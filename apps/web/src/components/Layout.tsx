import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Typography } from '@mui/material';
import { LayoutDashboard, Settings, Activity, ToyBrick, History as HistoryIcon, LogOut, Search } from 'lucide-react';
import { useAuth } from './AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-blue-600" />
            <span>AI Admin</span>
          </h1>
          {user && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Logged in as: {user.username}
            </Typography>
          )}
        </div>
        <nav className="mt-6 flex-1">
          <Link
            to="/"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/search"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Search className="w-5 h-5 mr-3" />
            <span>Search</span>
          </Link>
          <Link
            to="/plugins"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <ToyBrick className="w-5 h-5 mr-3" />
            <span>Plugins</span>
          </Link>
          <Link
            to="/journal"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <HistoryIcon className="w-5 h-5 mr-3" />
            <span>Journal</span>
          </Link>
          <Link
            to="/settings"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Settings className="w-5 h-5 mr-3" />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={() => logout()}
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
