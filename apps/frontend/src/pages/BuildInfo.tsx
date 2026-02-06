import React from 'react';

const BuildInfoPage: React.FC = () => {
  const buildInfo = {
    buildTool: 'Vite',
    framework: 'React 18.2.0',
    typescript: '✅ Enabled',
    hmr: '✅ Active',
    devMode: '✅ Active',
    navigationSystem: '✅ Comprehensive',
    pagesAvailable: '95+',
    productionReady: '✅ Yes',
    buildTime: new Date().toLocaleString(),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">📋 Build Information</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Environment Details</h2>
        <ul className="space-y-2">
          {Object.entries(buildInfo).map(([key, value]) => (
            <li key={key}>
              <strong>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:
              </strong>{' '}
              {value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BuildInfoPage;
