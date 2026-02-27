import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import { Server, MapPin, Activity, Eye, Edit, Trash2, Search, Filter, Plus, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const DVRs = () => {
  const [dvrs, setDvrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, online: 0, cameras: 0 });

  const fetchDvrs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dvrs');
      setDvrs(Array.isArray(response) ? response : []);

      if (Array.isArray(response)) {
        setStats({
          total: response.length,
          online: response.filter(d => d.isOnline).length,
          cameras: response.reduce((acc, curr) => acc + (parseInt(curr.total_cameras) || 0), 0)
        });
      }

    } catch (err) {
      console.error(err);
      setError("Failed to load DVRs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this DVR?')) {
      try {
        await api.delete(`/dvrs/${id}`);
        fetchDvrs();
      } catch (err) {
        alert('Failed to delete DVR');
      }
    }
  };

  useEffect(() => {
    fetchDvrs();
  }, []);

  const filteredDvrs = dvrs.filter(dvr => {
    const matchesSearch = dvr.dvr_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dvr.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' ? true :
      filterStatus === 'online' ? dvr.isOnline :
        !dvr.isOnline;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading DVRs...</div>;

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total DVRs" value={stats.total} icon={Server} color="text-blue-600" bg="bg-blue-100" />
        <StatCard title="Online DVRs" value={stats.online} icon={Wifi} color="text-green-600" bg="bg-green-100" />
        <StatCard title="Total Cameras" value={stats.cameras} icon={Activity} color="text-purple-600" bg="bg-purple-100" />
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search DVRs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="online">Online Only</option>
              <option value="offline">Offline Only</option>
            </select>
            <button onClick={fetchDvrs} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
            <NavLink to="/dvr/new" className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-md hover:from-blue-600 hover:to-blue-700 flex items-center transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Add DVR
            </NavLink>
          </div>
        </div>
      </div>

      {/* DVR List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">DVR Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDvrs.length > 0 ? filteredDvrs.map((dvr) => (
                <tr key={dvr.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                        <Server className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{dvr.dvr_name}</div>
                        <div className="text-xs text-gray-500">ID: {dvr.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {dvr.location_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${dvr.isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {dvr.isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                      {dvr.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <NavLink to={`/dvr/live/${dvr.id}`} className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </NavLink>
                      <NavLink to={`/dvr/edit/${dvr.id}`} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </NavLink>
                      <button onClick={() => handleDelete(dvr.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No DVRs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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

export default DVRs;
