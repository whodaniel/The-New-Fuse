import { FC, useState } from 'react';
export interface YouTubeTranscriberProps {
  onTranscribe?: (url: string) => void;
}
export const YouTubeTranscriber: FC<YouTubeTranscriberProps> = ({ onTranscribe }) => {
  const [url, setUrl] = useState('');
  return (
    <div className="tnf-yt-transcriber" data-testid="youtube-transcriber">
      <h3>YouTube Transcriber</h3>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube URL" />
      <button onClick={() => onTranscribe?.(url)}>Transcribe</button>
    </div>
  );
};
export default YouTubeTranscriber;
