import { Router } from "express";
import * as accountController from "./account.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, accountController.list);
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  accountController.create,
);
router.get("/:id", authenticate, accountController.getById);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  accountController.update,
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  accountController.remove,
);

export default router;
