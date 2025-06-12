import React, { useState, useEffect } from 'react';

export default function BuildInfoPage() {
  const [buildTime, setBuildTime] = useState('');

  useEffect(() => {
    setBuildTime(new Date().toLocaleString());
  }, []);
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📋 Build Information</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Environment Details</h2>
        <ul className="space-y-2">
          <li><strong>Build Tool:</strong> Vite</li>
          <li><strong>Framework:</strong> React 18.2.0</li>
          <li><strong>TypeScript:</strong> ✅ Enabled</li>
          <li><strong>Hot Module Replacement:</strong> ✅ Active</li>
          <li><strong>Development Mode:</strong> ✅ Active</li>
          <li><strong>Build Time:</strong> {buildTime}</li>
        </ul>
      </div>
    </div>
  );
}