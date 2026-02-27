import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Camera, Server, Save, ArrowLeft } from 'lucide-react';

const EditCamera = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    camera_name: '',
    rtsp_url: ''
  });
  const [dvrInfo, setDvrInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCamera = async () => {
      try {
        const data = await api.get(`/cameras/${id}`);
        setFormData({
          camera_name: data.camera_name,
          rtsp_url: data.rtsp_url
        });
        setDvrInfo({
          dvr_name: data.dvr_name
        });
      } catch (err) {
        setError("Failed to load camera details");
      } finally {
        setLoading(false);
      }
    };
    fetchCamera();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/cameras/${id}`, formData);
      navigate('/camera');
    } catch (err) {
      setError('Failed to update camera');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Camera className="w-6 h-6 mr-3 text-purple-600" /> Edit Camera
        </h2>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {dvrInfo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connected DVR</label>
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 flex items-center">
                <Server className="w-4 h-4 mr-2 text-gray-400" />
                {dvrInfo.dvr_name}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Camera Name</label>
            <input
              type="text"
              name="camera_name"
              value={formData.camera_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">RTSP URL</label>
            <input
              type="text"
              name="rtsp_url"
              value={formData.rtsp_url}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Update Camera'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCamera;
