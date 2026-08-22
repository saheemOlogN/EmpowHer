import express from "express";
import { recommendSchemes } from "../controllers/schemeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/recommend", authMiddleware, recommendSchemes);

export default router;
