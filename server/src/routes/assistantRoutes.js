import express from "express";
import { askAssistant } from "../controllers/assistantController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", askAssistant);

export default router;
