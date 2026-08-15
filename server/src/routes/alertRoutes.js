import express from "express";
import { createAlert, getAlerts, resolveAlert } from "../controllers/alertController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAlerts);
router.post("/", createAlert);
router.patch("/:alertId/resolve", resolveAlert);

export default router;
