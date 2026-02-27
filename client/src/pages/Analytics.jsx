import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Activity, Server, Camera, Clock, PieChart } from 'lucide-react';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.get('/analytics/data');
        // The API returns distinct objects, let's verify structure
        // analyticsController.getAnalyticsData returns JSON: {total_dvrs, total_cameras, active_streams, dvrs, activeDvrs}
        setData(result);
      } catch (err) {
        console.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

  const { total_dvrs, total_cameras, active_streams, activeDvrs } = data;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <PieChart className="w-8 h-8 mr-3 text-blue-600" />
        Analytics Dashboard
      </h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total DVRs"
          value={total_dvrs}
          subtitle="Surveillance Locations"
          icon={Server}
          color="text-blue-600"
          bg="bg-blue-100"
        />
        <StatCard
          title="Total Cameras"
          value={total_cameras}
          subtitle="Connected Devices"
          icon={Camera}
          color="text-purple-600"
          bg="bg-purple-100"
        />
        <StatCard
          title="Active Streams"
          value={active_streams}
          subtitle="Currently Streaming"
          icon={Activity}
          color="text-green-600"
          bg="bg-green-100"
        />
        <StatCard
          title="System Uptime"
          value="99.9%"
          subtitle="Last 30 Days"
          icon={Clock}
          color="text-orange-600"
          bg="bg-orange-100"
        />
      </div>

      {/* Detailed Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active DVRs List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Active DVR Activity</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {activeDvrs && activeDvrs.length > 0 ? activeDvrs.map((dvr, idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center mr-3">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{dvr.dvr_name}</div>
                    <div className="text-xs text-gray-500">{dvr.location_name || 'Unknown Location'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{dvr.activeCameraCount} Streams</div>
                  <div className="text-xs text-gray-400">Active Now</div>
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-gray-500">No active DVRs currently</div>
            )}
          </div>
        </div>

        {/* System Health / Performance Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-6">System Health</h3>
          <div className="space-y-4">
            <HealthItem label="Server Load" status="Normal (42%)" isGood={true} />
            <HealthItem label="Database Connection" status="Connected" isGood={true} />
            <HealthItem label="Storage Usage" status="78% Used" isGood={false} isWarning={true} />
            <HealthItem label="Memory Usage" status="2.4GB / 8GB" isGood={true} />
          </div>
        </div>
      </div>

    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, bg }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      <p className={`text-xs mt-1 font-medium ${color.replace('text-', 'text-opacity-80 ')}`}>{subtitle}</p>
    </div>
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </div>
);

const HealthItem = ({ label, status, isGood, isWarning }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border ${isGood ? 'bg-green-50 border-green-100' : isWarning ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'
    }`}>
    <span className="font-medium text-gray-700">{label}</span>
    <div className={`flex items-center font-bold ${isGood ? 'text-green-600' : isWarning ? 'text-yellow-600' : 'text-red-600'
      }`}>
      {status}
    </div>
  </div>
);

export default Analytics;
