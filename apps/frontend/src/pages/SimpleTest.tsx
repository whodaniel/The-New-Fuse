import React from 'react';

const SimpleTest: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Simple Test Page</h1>
      <p>If you can see this, React routing is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default SimpleTest;
