import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import { Camera, Server, MapPin, Eye, Edit, Trash2, Search, Video, Plus, RefreshCw } from 'lucide-react';

const Cameras = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cameras');
      setCameras(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load cameras");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this camera?')) {
      try {
        await api.delete(`/cameras/${id}`);
        fetchCameras();
      } catch (err) {
        alert('Failed to delete camera');
      }
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const filteredCameras = cameras.filter(cam =>
    cam.camera_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cam.dvr_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cam.location_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Loading cameras...</div>;

  return (
    <div>
      {/* Header / Stats could go here */}

      {/* Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search Cameras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchCameras} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
            <NavLink to="/camera/add" className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-md hover:from-blue-600 hover:to-blue-700 flex items-center transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Add Camera
            </NavLink>
          </div>
        </div>
      </div>

      {/* Camera List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Camera Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">DVR / Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">RTSP Stream</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCameras.length > 0 ? filteredCameras.map((cam) => (
                <tr key={cam.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mr-3">
                        <Camera className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{cam.camera_name}</div>
                        <div className="text-xs text-gray-500">ID: {cam.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 flex items-center mb-1">
                      <Server className="w-3 h-3 mr-1 text-gray-400" /> {cam.dvr_name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400" /> {cam.location_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 font-mono truncate max-w-[200px]" title={cam.rtsp_url}>
                      {cam.rtsp_url}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <NavLink to={`/camera/live/${cam.id}`} className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors" title="View Stream">
                        <Eye className="w-4 h-4" />
                      </NavLink>
                      <NavLink to={`/camera/edit/${cam.id}`} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </NavLink>
                      <button onClick={() => handleDelete(cam.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No cameras found.
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

export default Cameras;
