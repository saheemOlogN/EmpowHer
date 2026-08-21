import express from "express";
import {
    completeBooking,
    createBooking,
    getBookings,
    startBookingService,
    updateBookingTracking,
    updateBookingStatus
} from "../controllers/bookingController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getBookings);
router.post("/", createBooking);
router.patch("/:bookingId/status", updateBookingStatus);
router.patch("/:bookingId/start", startBookingService);
router.patch("/:bookingId/tracking", updateBookingTracking);
router.patch("/:bookingId/complete", completeBooking);

export default router;
