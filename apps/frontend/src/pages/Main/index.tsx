'use client';

import React from 'react';
import { AgentChatRoom } from '@/components/AgentChatRoom';

const MainPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
      <AgentChatRoom roomId="main-room" />
    </div>
  );
};

export default MainPage;