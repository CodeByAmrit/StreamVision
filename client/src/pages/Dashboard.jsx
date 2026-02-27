import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Server, Camera, Activity, HardDrive } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Set up polling interval if needed, e.g. every 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total DVRs"
          value={data.total_dvrs}
          icon={Server}
          color="text-blue-600"
          bg="bg-blue-100"
        />
        <StatCard
          title="Total Cameras"
          value={data.total_cameras}
          icon={Camera}
          color="text-green-600"
          bg="bg-green-100"
        />
        <StatCard
          title="Active Streams"
          value={data.active_streams}
          icon={Activity}
          color="text-purple-600"
          bg="bg-purple-100"
        />
      </div>

      {/* Active DVRs Section */}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Active DVRs</h2>
      {data.activeDvrs && data.activeDvrs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.activeDvrs.map((dvr) => (
            <div key={dvr.dvr_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{dvr.dvr_name}</h3>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Online</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Active Cameras: {dvr.activeCameraCount}
                </p>
                <p className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Last Activity: {new Date(dvr.lastActivity).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
          No active DVRs at the moment.
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
    <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center mr-4`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

export default Dashboard;
