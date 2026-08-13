import { Server } from 'node:http';

export const gracefulShutdown = (server: Server): any => {
  
  server.close(() => {
    
    process.exit(0);
  });
}; 