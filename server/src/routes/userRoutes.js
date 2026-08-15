import express from "express";
import { getDashboard } from "../controllers/userController.js";

const router = express.Router();

router.get("/:userId/dashboard", getDashboard);

export default router;
