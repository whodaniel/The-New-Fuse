import { Server } from 'http';

export const gracefulShutdown = (server: Server): any => {
  
  server.close(() => {
    
    process.exit(0);
  });
}; 