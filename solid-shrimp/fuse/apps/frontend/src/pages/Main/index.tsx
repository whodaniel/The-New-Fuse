// @ts-nocheck
'use client';

import { AgentChatRoom } from '@/components/AgentChatRoom';
import React from 'react';

const MainPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
      <AgentChatRoom roomId="main-room" />
    </div>
  );
};

export default MainPage;
