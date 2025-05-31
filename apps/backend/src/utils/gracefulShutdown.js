export const gracefulShutdown = (server) => {
    server.close(() => {
        process.exit(0);
    });
};
