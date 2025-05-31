import express from 'express';
export function createRouter() {
    return express.Router();
}
export function setupRoutes(app) {
    // Helper function to safely mount middleware
    function mountMiddleware(handler) {
        return (req, res, next) => {
            Promise.resolve(handler(req, res, next)).catch(next);
        };
    }
    // Helper function to safely mount a router
    function mountRouter(path, router) {
        app.use(path, (req, res, next) => {
            router(req, res, next);
        });
    }
    return {
        mountMiddleware,
        mountRouter
    };
}
