import express from "express";
import {
    completeSignup,
    login,
    sendOtp,
    simulateIdentityCheck,
    verifyOtp
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup/send-otp", sendOtp);
router.post("/signup/verify-otp", verifyOtp);
router.post("/signup/identity-check", simulateIdentityCheck);
router.post("/signup/complete", completeSignup);
router.post("/login", login);

export default router;
