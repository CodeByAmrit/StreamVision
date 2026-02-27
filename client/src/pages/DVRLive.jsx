import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import { ArrowLeft, Grid, MapPin } from 'lucide-react';

const DVRLive = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dvr, setDVR] = useState(null);
  const [streamUrls, setStreamUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDVRAndStartStreams = async () => {
      try {
        const dvrData = await api.get(`/dvrs/${id}`);
        setDVR(dvrData);

        if (dvrData.cameras && dvrData.cameras.length > 0) {
          // Initiate streams for all cameras in parallel
          const streamPromises = dvrData.cameras.map(async (cam) => {
            try {
              const res = await api.post('/start-stream', { rtspUrl: cam.rtsp_url });
              return { id: cam.id, url: res.hlsUrl };
            } catch (e) {
              console.error(`Failed to start stream for camera ${cam.id}`, e);
              return { id: cam.id, url: null };
            }
          });

          const results = await Promise.all(streamPromises);
          const urlMap = {};
          results.forEach(r => {
            if (r.url) urlMap[r.id] = r.url;
          });
          setStreamUrls(urlMap);
        }
      } catch (err) {
        setError("Failed to load DVR details");
      } finally {
        setLoading(false);
      }
    };
    fetchDVRAndStartStreams();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-white">Loading DVR feeds...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!dvr) return <div className="p-8 text-center text-white">DVR not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gray-900 border-b border-gray-800 pb-6 -mx-6 px-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Grid className="w-6 h-6 mr-3 text-blue-500" />
              {dvr.dvr_name}
            </h1>
            <p className="text-sm text-gray-400 flex items-center mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {dvr.location_name} • {dvr.cameras?.length || 0} Cameras
            </p>
          </div>
        </div>
        <div className="text-green-500 text-sm font-medium flex items-center bg-green-500/10 px-3 py-1 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          Live View
        </div>
      </div>

      {dvr.cameras && dvr.cameras.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dvr.cameras.map((camera) => (
            <div key={camera.id} className="bg-black rounded-lg overflow-hidden relative group">
              {streamUrls[camera.id] ? (
                <VideoPlayer
                  streamUrl={streamUrls[camera.id]}
                  className="aspect-video"
                  autoPlay={true}
                  muted={true}
                />
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gray-900 text-gray-500">
                  <p>Stream Request Failed</p>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium truncat block">
                  {camera.camera_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-800 border-dashed">
          No cameras connected to this DVR.
        </div>
      )}
    </div>
  );
};

export default DVRLive;
