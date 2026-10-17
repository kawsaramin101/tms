import { Router } from "express";
import * as memberController from "./member.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/members/search", authenticate, memberController.searchMembers);
router.get("/members", authenticate, memberController.listMembers);
router.post("/members", authenticate, authorize("ADMIN", "TREASURER"), memberController.createMember);
router.get("/members/:id", authenticate, memberController.getMember);
router.patch("/members/:id", authenticate, authorize("ADMIN", "TREASURER"), memberController.updateMember);
router.patch("/members/:id/status", authenticate, authorize("ADMIN", "TREASURER"), memberController.updateMemberStatus);

router.get("/fee-types", authenticate, memberController.listFeeTypes);
router.post("/fee-types", authenticate, authorize("ADMIN", "TREASURER"), memberController.createFeeType);
router.get("/fee-types/:id", authenticate, memberController.getFeeType);
router.patch("/fee-types/:id", authenticate, authorize("ADMIN", "TREASURER"), memberController.updateFeeType);
router.patch("/fee-types/:id/status", authenticate, authorize("ADMIN", "TREASURER"), memberController.updateFeeTypeStatus);

router.get("/member-fees", authenticate, memberController.listMemberFees);
router.post("/member-fees", authenticate, authorize("ADMIN", "TREASURER"), memberController.createMemberFee);
router.get("/member-fees/:id", authenticate, memberController.getMemberFee);
router.patch("/member-fees/:id", authenticate, authorize("ADMIN", "TREASURER"), memberController.updateMemberFee);
router.patch("/member-fees/:id/status", authenticate, authorize("ADMIN", "TREASURER"), memberController.updateMemberFeeStatus);

router.get("/fee-payments", authenticate, memberController.listFeePayments);
router.post("/fee-payments", authenticate, authorize("ADMIN", "TREASURER"), memberController.createFeePayment);
router.get("/fee-payments/:id", authenticate, memberController.getFeePayment);

export default router;
