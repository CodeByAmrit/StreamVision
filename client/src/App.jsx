import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import DVRs from './pages/DVRs';
import Cameras from './pages/Cameras';
import AddCamera from './pages/AddCamera';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import LiveView from './pages/LiveView';
import DVRLive from './pages/DVRLive';
import AddDVR from './pages/AddDVR';
import EditDVR from './pages/EditDVR';
import EditCamera from './pages/EditCamera';


// Placeholder components for other routes
const Placeholder = ({ title }) => <div className="p-4 text-xl">{title} Page (Coming Soon)</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes wrapped in Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dvr" element={<DVRs />} />
          <Route path="cameras" element={<Cameras />} />
          <Route path="camera/add" element={<AddCamera />} />
          <Route path="settings" element={<Settings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="camera/live/:id" element={<LiveView />} />
          <Route path="dvr/live/:id" element={<DVRLive />} />
          <Route path="dvr/new" element={<AddDVR />} />
          <Route path="dvr/edit/:id" element={<EditDVR />} />
          <Route path="camera/edit/:id" element={<EditCamera />} />

        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
