'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { AgentChatRoom } from '@/components/AgentChatRoom';
var MainPage = function () {
    return (_jsx("div", { className: "min-h-screen bg-gray-100 p-8 flex justify-center items-center", children: _jsx(AgentChatRoom, { roomId: "main-room" }) }));
};
export default MainPage;
