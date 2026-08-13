// @ts-nocheck
'use client';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { PremiumInput as Input } from '@/components/ui/premium/PremiumInput';
import { CameraOff, Mic, Send, Video } from 'lucide-react';
import { useRef, useState } from 'react';
import { webSocketService } from '../services/websocket';

export function MultiModalInteraction() {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSend = () => {
    webSocketService.send('multiModalInput', { type: 'text', content: input });
    setInput('');
  };

  const handleVoice = () => {
    if (!isRecording) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        setIsRecording(true);
        const audioChunks: Blob[] = [];
        mediaRecorder.addEventListener('dataavailable', (event) => {
          audioChunks.push(event.data);
        });
        mediaRecorder.addEventListener('stop', () => {
          const audioBlob = new Blob(audioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);
          webSocketService.send('multiModalInput', { type: 'audio', content: audioUrl });
        });
        setTimeout(() => {
          mediaRecorder.stop();
          setIsRecording(false);
        }, 5000);
      });
    }
  };

  const handleCamera = () => {
    if (!isCameraOn && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraOn(true);
        }
      });
    } else if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  return (
    <Card title="Multi-Modal Interaction" gradient="pink" className="w-full max-w-lg">
      <div className="space-y-4">
        <Input
          label="Text Input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />

        <div className="flex gap-2">
          <Button onClick={handleSend} variant="primary" size="sm">
            <Send className="w-4 h-4 mr-2" /> Send
          </Button>
          <Button onClick={handleVoice} variant={isRecording ? 'destructive' : 'outline'} size="sm">
            <Mic className="w-4 h-4 mr-2" /> {isRecording ? 'Recording...' : 'Voice'}
          </Button>
          <Button onClick={handleCamera} variant={isCameraOn ? 'destructive' : 'outline'} size="sm">
            {isCameraOn ? (
              <CameraOff className="w-4 h-4 mr-2" />
            ) : (
              <Video className="w-4 h-4 mr-2" />
            )}
            {isCameraOn ? 'Stop' : 'Camera'}
          </Button>
        </div>

        {isCameraOn && (
          <div className="rounded-md overflow-hidden border border-white/10">
            <video ref={videoRef} className="w-full" autoPlay playsInline />
          </div>
        )}
      </div>
    </Card>
  );
}
