import express from "express";
import {
    getDashboard,
    getLocalitySummary,
    getSharedLocations,
    searchPeople,
    shareLocation,
    updateLocality,
    updateLocation
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me/dashboard", getDashboard);
router.get("/shared-locations", getSharedLocations);
router.get("/locality-summary", getLocalitySummary);
router.get("/search", searchPeople);
router.patch("/:userId/location", updateLocation);
router.patch("/:userId/locality", updateLocality);
router.post("/:userId/share-location", shareLocation);

export default router;
