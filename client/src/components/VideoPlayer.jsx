import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, RefreshCw } from 'lucide-react';

const VideoPlayer = ({ streamUrl, poster, className, autoPlay = true, muted = true }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      const video = videoRef.current;
      if (!video) return;

      setLoading(true);
      setError(null);

      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isMounted) {
            setLoading(false);
            if (autoPlay) {
              video.play().catch(e => console.log("Autoplay prevented:", e));
            }
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("Network error encountered, trying to recover...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("Media error encountered, trying to recover...");
                hls.recoverMediaError();
                break;
              default:
                console.error("Fatal error, cannot recover");
                if (isMounted) {
                  hls.destroy();
                  setError("Stream unavailable");
                  setLoading(false);
                }
                break;
            }
          }
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          if (isMounted) {
            setLoading(false);
            if (autoPlay) video.play();
          }
        });

        video.addEventListener('error', () => {
          if (isMounted) {
            setError("Stream failed to load");
            setLoading(false);
          }
        });
      } else {
        if (isMounted) {
          setError("HLS not supported in this browser");
          setLoading(false);
        }
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl, retryCount, autoPlay]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900 bg-opacity-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900 text-white p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        controls
        playsInline
        muted={muted}
      />
    </div>
  );
};

export default VideoPlayer;
