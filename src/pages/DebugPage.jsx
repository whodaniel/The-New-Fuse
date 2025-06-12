import React, { useState, useEffect } from 'react';

export default function DebugPage() {
  const [path, setPath] = useState('');
  const [origin, setOrigin] = useState('');
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    setPath(window.location.pathname);
    setOrigin(window.location.origin);
    setUserAgent(navigator.userAgent.substring(0, 50) + '...');
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🐛 Debug Information</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Server Info</h2>
          <ul className="space-y-2">
            <li><strong>Port:</strong> 3001</li>
            <li><strong>Environment:</strong> Development</li>
            <li><strong>Hot Reload:</strong> ✅ Active</li>
            <li><strong>Router:</strong> ✅ Working</li>
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Routing Details</h2>
          <ul className="space-y-2">
            <li><strong>Current Path:</strong> {path}</li>
            <li><strong>Base URL:</strong> {origin}</li>
            <li><strong>User Agent:</strong> {userAgent}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}