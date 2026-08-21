import express from "express";
import {
    closeOpportunity,
    createOpportunity,
    getOpportunities
} from "../controllers/opportunityController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getOpportunities);
router.post("/", createOpportunity);
router.patch("/:opportunityId/close", closeOpportunity);

export default router;
