import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import { ArrowLeft, Monitor, MapPin, HardDrive } from 'lucide-react';

const LiveView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [camera, setCamera] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCameraAndStartStream = async () => {
      try {
        const camData = await api.get(`/cameras/${id}`);
        setCamera(camData);

        // Start Stream
        const streamRes = await api.post('/start-stream', { rtspUrl: camData.rtsp_url });
        setStreamUrl(streamRes.hlsUrl);
      } catch (err) {
        setError("Failed to load camera or stream");
      } finally {
        setLoading(false);
      }
    };
    fetchCameraAndStartStream();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-white">Loading camera...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!camera || !streamUrl) return <div className="p-8 text-center text-white">Stream unavailable</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Monitor className="w-6 h-6 mr-3 text-green-500" />
          {camera.camera_name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video Player */}
        <div className="lg:col-span-2">
          <VideoPlayer
            streamUrl={streamUrl}
            className="aspect-video shadow-2xl border border-gray-800"
            autoPlay={true}
            muted={true}
          />
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Camera Details</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <HardDrive className="w-5 h-5 text-blue-400 mr-3 mt-1" />
                <div>
                  <div className="text-xs text-gray-400">Connected DVR</div>
                  <div className="text-white font-medium">{camera.dvr_name}</div>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-red-400 mr-3 mt-1" />
                <div>
                  <div className="text-xs text-gray-400">Location</div>
                  <div className="text-white font-medium">{camera.location_name}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">RTSP URL</div>
                <code className="block bg-gray-900 p-2 rounded text-xs text-green-400 break-all font-mono">
                  {camera.rtsp_url}
                </code>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Stream Status</h3>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-400 font-medium">Live Streaming</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveView;
