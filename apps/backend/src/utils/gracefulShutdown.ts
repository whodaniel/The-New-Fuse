import { Server } from 'http.js';

export const gracefulShutdown = (server: Server): any => {
  
  server.close(() => {
    
    process.exit(0);
  });
}; 