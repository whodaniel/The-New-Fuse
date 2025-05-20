import { SocketIoConfig } from '@nestjs/platform-socket.io';

export const socketConfig: SocketIoConfig = {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://thenewfuse.com' 
      : 'http://localhost:3000',
    credentials: true
  },
  transports: ['websocket'],
  allowEIO3: true
};
