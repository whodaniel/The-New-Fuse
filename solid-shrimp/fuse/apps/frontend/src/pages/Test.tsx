import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Test Page</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Component Testing</h2>
        <p className="text-gray-700 mb-4">
          This is a simple test page used for development and testing purposes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">Responsive Layout</h3>
            <p className="text-gray-600">Test how components respond to different screen sizes</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">Component States</h3>
            <p className="text-gray-600">Test various component states and interactions</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">Theme Testing</h3>
            <p className="text-gray-600">Verify theme consistency across components</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">Performance Testing</h3>
            <p className="text-gray-600">Check component rendering performance</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default TestPage;