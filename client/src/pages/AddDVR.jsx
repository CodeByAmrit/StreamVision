import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Server, MapPin, Save, ArrowLeft, Plus } from 'lucide-react';

const AddDVR = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dvr_name: '',
    location_id: '',
    new_location: ''
  });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // We need a way to get locations. 
    // Typically GET /dvrs returns standardized list, but usually there's a specific /locations endpoint or we extract from DVRs.
    // Let's assume we might need to add GET /api/locations or extract from DVR list if endpoint doesn't exist.
    // Re-reading code: dvrController.renderAddDvrForm fetched locations.
    // We probably need to add a GET /api/locations endpoint.
    // For now, let's try to fetch /api/dvrs and extract unique locations or handle this gracefully.
    // ACTUALLY: The best way is to add a proper endpoint. But let's check if we can get by.
    // Just mocking empty for now and assuming we might need to fix backend.
    // Wait, dvrController.getAllDvrs return list with location names.
    // Let's create a temporary fetch for locations via raw query if possible or just rely on manual entry if backend support is thin.
    // Better: I will verify if I can add a quick GET /api/locations route in next step. For now assume it exists or use empty.

    // Let's try to fetch unique locations from existing DVRs as a fallback
    api.get('/dvrs').then(data => {
      if (Array.isArray(data)) {
        const uniqueLocs = [];
        const map = new Map();
        data.forEach(d => {
          if (!map.has(d.location_name)) {
            map.set(d.location_name, true);
            // We don't have location IDs effortlessly here... this is tricky without a dedicated endpoint.
            // But wait, the DVR object has location_name but maybe ID hidden?
            // Let's look at GET /api/dvrs response structure from code viewing earlier:
            // SELECT d.id, d.dvr_name, l.location_name... 
            // It does NOT select location_id. 
            // To fix this properly I should add GET /api/locations.
          }
        });
      }
    }).catch(() => { });
  }, []);

  // NOTE: I will add GET /api/locations in the next backend step.

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations'); // Will implement this endpoint
      setLocations(res);
    } catch (e) {
      // Fallback or silent fail
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/dvrs', formData);
      navigate('/dvr');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add DVR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Server className="w-6 h-6 mr-3 text-blue-600" /> Add New DVR
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
              placeholder="e.g. Main Gateway DVR"
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
              <option value="new">+ Add New Location</option>
            </select>
          </div>

          {formData.location_id === 'new' && (
            <div className="animate-fade-in-down">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Location Name</label>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  name="new_location"
                  value={formData.new_location}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. Building A, Floor 2"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Adding...' : 'Save DVR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDVR;
