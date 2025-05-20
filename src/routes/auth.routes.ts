import { Router } from "express";
import { authController } from '../controllers/auth.controller.js';

const router: Router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/session", authController.checkSession);
router.post("/reset-password", authController.initiatePasswordReset);
router.post("/verify-email", authController.verifyEmail);

export default router;
