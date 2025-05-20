"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiModalInteraction = MultiModalInteraction;
import react_1 from 'react';
import button_1 from '@/components/ui/button';
import textarea_1 from '@/components/ui/textarea';
import card_1 from '@/components/ui/card';
import lucide_react_1 from 'lucide-react';
import websocket_1 from '../services/websocket.js';
function MultiModalInteraction() {
    const [input, setInput] = (0, react_1.useState)('');
    const [isRecording, setIsRecording] = (0, react_1.useState)(false);
    const [isCameraOn, setIsCameraOn] = (0, react_1.useState)(false);
    const videoRef = (0, react_1.useRef)(null);
    const handleSend = () => {
        websocket_1.webSocketService.send('multiModalInput', { type: 'text', content: input });
        setInput('');
    };
    const handleVoice = () => {
        if (!isRecording) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                setIsRecording(true);
                const audioChunks = [];
                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });
                mediaRecorder.addEventListener("stop", () => {
                    const audioBlob = new Blob(audioChunks);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    websocket_1.webSocketService.send('multiModalInput', { type: 'audio', content: audioUrl });
                });
                setTimeout(() => {
                    mediaRecorder.stop();
                    setIsRecording(false);
                }, 5000);
            });
        }
    };
    const handleCamera = () => {
        if (!isCameraOn) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsCameraOn(true);
            });
        }
        else {
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            setIsCameraOn(false);
        }
    };
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            websocket_1.webSocketService.send('multiModalInput', { type: 'image', content: reader.result });
        };
        reader.readAsDataURL(file);
    };
    return (<card_1.Card className="w-full max-w-md">
      <card_1.CardHeader>
        <card_1.CardTitle>Multi-Modal Interaction</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-4">
        <textarea_1.Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." className="w-full"/>
        <div className="flex justify-between">
          <button_1.Button onClick={handleVoice}>
            <lucide_react_1.Mic className={`mr-2 h-4 w-4 ${isRecording ? 'text-red-500' : ''}`}/>
            {isRecording ? 'Recording...' : 'Voice'}
          </button_1.Button>
          <button_1.Button onClick={handleCamera}>
            <lucide_react_1.Camera className={`mr-2 h-4 w-4 ${isCameraOn ? 'text-green-500' : ''}`}/>
            {isCameraOn ? 'Camera On' : 'Camera'}
          </button_1.Button>
          <button_1.Button onClick={() => document.getElementById('imageUpload').click()}>
            <lucide_react_1.Upload className="mr-2 h-4 w-4"/>
            Upload Image
          </button_1.Button>
          <input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }}/>
        </div>
        <button_1.Button onClick={handleSend} className="w-full">Send</button_1.Button>
        {isCameraOn && (<video ref={videoRef} className="w-full h-48 object-cover"/>)}
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=multi-modal-interaction.js.map