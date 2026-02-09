import React, { useEffect, useState } from 'react';

export const PerformanceMonitor: React.FC = () => {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<number>(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const updateMetrics = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime > 1000) {
        setFps(Math.round(frameCount * 1000 / (now - lastTime)));
        frameCount = 0;
        lastTime = now;

        // Update memory usage if available
        if (performance?.memory) {
          setMemory(Math.round(performance.memory.usedJSHeapSize / 1048576));
        }
      }

      requestAnimationFrame(updateMetrics);
    };

    requestAnimationFrame(updateMetrics);

    return () => {
      frameCount = 0;
    };
  }, []);

  return (
    <div className="performance-monitor space-y-1 text-sm">
      <div className="flex justify-between">
        <span>FPS:</span>
        <span className={fps < 30 ? 'text-red-500' : 'text-green-500'}>
          {fps}
        </span>
      </div>
      {memory > 0 && (
        <div className="flex justify-between">
          <span>Memory:</span>
          <span>{memory} MB</span>
        </div>
      )}
    </div>
  );
};