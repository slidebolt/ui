import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Plugins from './pages/Plugins';
import Devices from './pages/Devices';
import Entities from './pages/Entities';
import Journal from './pages/Journal';
import Search from './pages/Search';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './components/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="search" element={<Search />} />
            <Route path="plugins" element={<Plugins />} />
            <Route path="plugins/:pluginId/devices" element={<Devices />} />
            <Route path="plugins/:pluginId/devices/:deviceId/entities" element={<Entities />} />
            <Route path="journal" element={<Journal />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;