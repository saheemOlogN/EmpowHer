import express from "express";
import { markWorkerSafe } from "../controllers/workerController.js";

const router = express.Router();

router.post("/:workerId/mark-safe", markWorkerSafe);

export default router;
