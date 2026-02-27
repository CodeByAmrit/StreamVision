import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Server, MapPin, Save, ArrowLeft } from 'lucide-react';

const EditDVR = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dvr_name: '',
    location_id: '' // We might need to handle locations properly
  });
  const [locations, setLocations] = useState([]); // We need to fetch locations
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Locations first (parallel)
        // Note: We need to implement GET /api/locations check logic
        const locsReq = api.get('/locations').catch(() => []);
        const dvrReq = api.get(`/dvrs/${id}`);

        const [locs, dvr] = await Promise.all([locsReq, dvrReq]);
        setLocations(locs);

        // DVR API response: { id, dvr_name, location_name, location_id (maybe missing in current API?) }
        // Checking dvrController.getDvrWithCamerasById
        // It selects dvrs.*, locations.location_name. 
        // So it HAS location_id from dvrs table.
        setFormData({
          dvr_name: dvr.dvr_name,
          location_id: dvr.location_id
        });
      } catch (err) {
        setError("Failed to load DVR details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/dvrs/${id}`, formData);
      navigate('/dvr');
    } catch (err) {
      setError('Failed to update DVR');
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
          <Server className="w-6 h-6 mr-3 text-blue-600" /> Edit DVR
        </h2>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">DVR Name</label>
            <input
              type="text"
              name="dvr_name"
              value={formData.dvr_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              name="location_id"
              value={formData.location_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="" disabled>Select Location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.location_name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Update DVR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDVR;
