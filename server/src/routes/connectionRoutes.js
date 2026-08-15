import express from "express";
import {
    acceptRequest,
    declineRequest,
    getConnections,
    sendRequest
} from "../controllers/connectionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getConnections);
router.post("/", sendRequest);
router.patch("/:connectionId/accept", acceptRequest);
router.delete("/:connectionId", declineRequest);

export default router;
