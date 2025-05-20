"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import components_1 from '../components.js';
import material_1 from '@mui/material';
import store_1 from '../store.js';
import SocketContext_1 from '../services/SocketContext.js';
const ChatInterface = () => {
    const { activeChat, agents } = (0, store_1.default)();
    const { socket, isConnected } = (0, SocketContext_1.useSocket)();
    const [isVoiceEnabled, setIsVoiceEnabled] = react_1.default.useState(false);
    react_1.default.useEffect(() => {
        if (!socket)
            return;
        socket.on('message', (message) => {
            
        });
        return () => {
            socket.off('message');
        };
    }, [socket]);
    return (<div className="p-6 h-full">
      <material_1.Grid container spacing={3} className="h-full">
        
        <material_1.Grid item xs={12} md={8} className="h-full">
          <material_1.Paper className="p-4 h-full flex flex-col">
            {activeChat ? (<components_1.ChatRoom chat={activeChat}/>) : (<div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Select or start a chat to begin</p>
              </div>)}
          </material_1.Paper>
        </material_1.Grid>

        <material_1.Grid item xs={12} md={4} className="h-full">
          <material_1.Grid container spacing={3}>
            
            <material_1.Grid item xs={12}>
              <material_1.Paper className="p-4">
                <components_1.VoiceControl isEnabled={isVoiceEnabled} onToggle={() => setIsVoiceEnabled(!isVoiceEnabled)}/>
              </material_1.Paper>
            </material_1.Grid>

            <material_1.Grid item xs={12}>
              <material_1.Paper className="p-4">
                <components_1.MultiModalInteraction />
              </material_1.Paper>
            </material_1.Grid>

            <material_1.Grid item xs={12}>
              <material_1.Paper className="p-4">
                <components_1.AIAssistant />
              </material_1.Paper>
            </material_1.Grid>
          </material_1.Grid>
        </material_1.Grid>
      </material_1.Grid>
    </div>);
};
exports.default = ChatInterface;
export {};
//# sourceMappingURL=ChatInterface.js.map