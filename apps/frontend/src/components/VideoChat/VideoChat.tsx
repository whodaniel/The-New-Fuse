import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const VideoChat: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const updateMediaStream = async () => {
      try {
        if (isCameraOn || isAudioOn) {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: isCameraOn,
            audio: isAudioOn,
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setError('');
        } else {
          if (stream) {
            stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            setStream(null);
          }
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Failed to access camera or microphone. Please check your permissions.');
        setIsCameraOn(false);
        setIsAudioOn(false);
      }
    };
    updateMediaStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn, isAudioOn]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Video Chat</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsAudioOn(!isAudioOn)}
            className={`p-2 rounded-full transition-colors ${
              isAudioOn
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
            }`}
            title={isAudioOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`p-2 rounded-full transition-colors ${
              isCameraOn
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
            }`}
            title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="p-4">
        {error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        ) : (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            {isCameraOn || isAudioOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={!isAudioOn}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-gray-500 dark:text-gray-400">
                <VideoOff className="w-12 h-12 opacity-50" />
                <p>Turn on camera or microphone to start</p>
              </div>
            )}

            {/* Status indicators overlaid */}
            {(isCameraOn || isAudioOn) && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {!isAudioOn && (
                  <div className="bg-red-600 text-white p-1.5 rounded-full">
                    <MicOff className="w-4 h-4" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoChat;
