import express from "express";
import { analyzeArea } from "../controllers/safetyController.js";

const router = express.Router();

router.post("/analyze", analyzeArea);

export default router;
