import express from "express";
import { getMyRatings, markWorkerSafe, requestIdVerification } from "../controllers/workerController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me/ratings", getMyRatings);
router.post("/:workerId/mark-safe", markWorkerSafe);
router.post("/:workerId/verify-id", requestIdVerification);

export default router;
