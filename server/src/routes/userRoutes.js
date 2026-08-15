import express from "express";
import {
    getDashboard,
    getSharedLocations,
    shareLocation,
    updateLocation
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me/dashboard", getDashboard);
router.get("/shared-locations", getSharedLocations);
router.patch("/:userId/location", updateLocation);
router.post("/:userId/share-location", shareLocation);

export default router;
