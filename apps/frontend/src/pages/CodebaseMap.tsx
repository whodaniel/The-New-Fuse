import React from 'react';
import InteractiveCodebaseMap from '../components/visualization/InteractiveCodebaseMap';

const CodebaseMapPage: React.FC = () => {
  return (
    <div className="w-screen h-screen">
      <InteractiveCodebaseMap />
    </div>
  );
};

export default CodebaseMapPage;
