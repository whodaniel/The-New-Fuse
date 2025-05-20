"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import ui_1 from '../../shared/components/ui.js';
import icons_material_1 from '@mui/icons-material';
const VideoChat = () => {
    const videoRef = (0, react_1.useRef)(null);
    const [stream, setStream] = react_1.default.useState(null);
    const [isCameraOn, setIsCameraOn] = react_1.default.useState(false);
    const [isAudioOn, setIsAudioOn] = react_1.default.useState(false);
    const [error, setError] = react_1.default.useState('');
    (0, react_1.useEffect)(() => {
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
                }
                else {
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                        setStream(null);
                    }
                }
            }
            catch (err) {
                console.error('Error accessing media devices:', err);
                setError('Failed to access camera or microphone. Please check your permissions.');
                setIsCameraOn(false);
                setIsAudioOn(false);
            }
        };
        updateMediaStream();
    }, [isCameraOn, isAudioOn]);
    return (<ui_1.Card variant="default" className="w-full max-w-2xl mx-auto">
      <ui_1.CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Video Chat</h3>
          <div className="flex space-x-2">
            <ui_1.Button variant={isAudioOn ? 'destructive' : 'default'} size="small" onClick={() => setIsAudioOn(!isAudioOn)} className="!p-2">
              {isAudioOn ? (<icons_material_1.MicOff className="w-5 h-5"/>) : (<icons_material_1.Mic className="w-5 h-5"/>)}
            </ui_1.Button>
            <ui_1.Button variant={isCameraOn ? 'destructive' : 'default'} size="small" onClick={() => setIsCameraOn(!isCameraOn)} className="!p-2">
              {isCameraOn ? (<icons_material_1.VideocamOff className="w-5 h-5"/>) : (<icons_material_1.Videocam className="w-5 h-5"/>)}
            </ui_1.Button>
          </div>
        </div>
      </ui_1.CardHeader>

      <ui_1.CardContent>
        {error ? (<div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>) : (<div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
            {(isCameraOn || isAudioOn) ? (<video ref={videoRef} autoPlay playsInline muted={!isAudioOn} className="absolute inset-0 w-full h-full object-cover"/>) : (<div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500">
                  Turn on camera or microphone to start
                </p>
              </div>)}
          </div>)}
      </ui_1.CardContent>
    </ui_1.Card>);
};
exports.default = VideoChat;
export {};
//# sourceMappingURL=VideoChat.js.map