import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Camera, Server, ArrowLeft, Save } from 'lucide-react';

const AddCamera = () => {
  const navigate = useNavigate();
  const [dvrs, setDvrs] = useState([]);
  const [formData, setFormData] = useState({
    dvr_id: '',
    camera_name: '',
    rtsp_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchingDvrs, setFetchingDvrs] = useState(true);

  useEffect(() => {
    const fetchDvrs = async () => {
      try {
        const response = await api.get('/dvrs');
        setDvrs(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Failed to fetch DVRs", err);
      } finally {
        setFetchingDvrs(false);
      }
    };
    fetchDvrs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/cameras', formData);
      navigate('/cameras');
    } catch (err) {
      console.error("Failed to add camera", err);
      alert("Failed to add camera");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Camera className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Camera</h2>
          <p className="text-gray-500">Connect a new RTSP stream to a DVR</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select DVR</label>
            <select
              value={formData.dvr_id}
              onChange={(e) => setFormData({ ...formData, dvr_id: e.target.value })}
              required
              disabled={fetchingDvrs}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            >
              <option value="">-- Select a DVR --</option>
              {dvrs.map(dvr => (
                <option key={dvr.id} value={dvr.id}>
                  {dvr.dvr_name} ({dvr.location_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Camera Name</label>
            <input
              type="text"
              value={formData.camera_name}
              onChange={(e) => setFormData({ ...formData, camera_name: e.target.value })}
              required
              placeholder="e.g. Main Entrance"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">RTSP URL</label>
            <input
              type="text"
              value={formData.rtsp_url}
              onChange={(e) => setFormData({ ...formData, rtsp_url: e.target.value })}
              required
              placeholder="rtsp://user:pass@ip:port/stream"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-3.5 rounded-xl shadow-md flex items-center justify-center transition-all disabled:opacity-70"
          >
            {loading ? 'Saving...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Add Camera
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCamera;
