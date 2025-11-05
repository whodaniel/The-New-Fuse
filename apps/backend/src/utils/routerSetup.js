"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = createRouter;
exports.setupRoutes = setupRoutes;
const express_1 = __importDefault(require("express"));
function createRouter() {
    return express_1.default.Router();
}
function setupRoutes(app) {
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
//# sourceMappingURL=routerSetup.js.map