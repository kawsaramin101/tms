import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/login", authController.login);

router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);
router.post("/change-password", authenticate, authController.changePassword);

// Admin user management
router.get("/users", authenticate, authorize("ADMIN"), authController.listUsers);
router.post("/users", authenticate, authorize("ADMIN"), authController.createUser);
router.patch("/users/:id", authenticate, authorize("ADMIN"), authController.updateUser);
router.patch(
  "/users/:id/status",
  authenticate,
  authorize("ADMIN"),
  authController.updateUserStatus,
);

export default router;
