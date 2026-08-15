import express from "express";
import {
    confirmArrival,
    getActiveCheckins,
    getCheckinsToWatch,
    markOverdue,
    startCheckin
} from "../controllers/checkinController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/active", getActiveCheckins);
router.get("/watch", getCheckinsToWatch);
router.post("/", startCheckin);
router.patch("/:checkinId/arrived", confirmArrival);
router.patch("/:checkinId/overdue", markOverdue);

export default router;
