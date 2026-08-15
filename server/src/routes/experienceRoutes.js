import express from "express";
import { createExperience, getExperiences, toggleLike } from "../controllers/experienceController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getExperiences);
router.post("/", createExperience);
router.patch("/:experienceId/like", toggleLike);

export default router;
