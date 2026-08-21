import Booking from "../models/Booking.js";
import User from "../models/User.js";

const workerPublicFields = "name role workType locality safetyRating ratingCount idVerified identityVerified";
const bookingStatuses = ["pending", "accepted", "rejected", "active", "completed"];
const workerForbiddenWomanFields = ["woman", "womanName", "name", "phone", "email", "profilePhoto", "photo", "location"];

const workerSummary = (worker) => ({
    _id: worker._id,
    name: worker.name,
    workType: worker.workType || worker.profession || "Worker",
    locality: worker.locality,
    rating: worker.safetyRating || 0,
    ratingCount: worker.ratingCount || 0,
    ratingLabel: `${worker.safetyRating || 0} from ${worker.ratingCount || 0} ratings`,
    inAppContact: `empowher://chat/workers/${worker._id}`
});

const canWorkerViewExactAddress = (booking, requester) => (
    requester.role === "worker"
    && String(booking.worker?._id || booking.worker) === requester.userId
    && ["accepted", "active", "completed"].includes(booking.status)
    && new Date(booking.scheduledFor).getTime() <= Date.now()
);

const hasTracking = (booking) => (
    booking.tracking?.latitude !== null
    && booking.tracking?.latitude !== undefined
    && booking.tracking?.longitude !== null
    && booking.tracking?.longitude !== undefined
);

const logWorkerPiiLeakCheck = (payload, req, booking) => {
    if(req.user.role !== "worker") return;

    const leakedFields = workerForbiddenWomanFields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));
    const lockedAddressLeak = payload.exactAddress && !canWorkerViewExactAddress(booking, req.user);

    if(leakedFields.length || lockedAddressLeak) {
        console.warn("[privacy] blocked worker PII exposure", {
            bookingId: booking._id,
            workerId: req.user.userId,
            leakedFields: [
                ...leakedFields,
                ...(lockedAddressLeak ? ["exactAddress_before_unlock"] : [])
            ]
        });
    }
};

const serializeBooking = (bookingDocument, req) => {
    const booking = bookingDocument.toObject ? bookingDocument.toObject() : bookingDocument;
    const base = {
        _id: booking._id,
        taskType: booking.taskType,
        scheduledFor: booking.scheduledFor,
        timeWindow: booking.timeWindow,
        problem: booking.problem,
        quotation: booking.quotation,
        area: booking.area,
        notes: booking.notes,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
    };

    if(req.user.role === "worker") {
        const payload = { ...base };

        if(canWorkerViewExactAddress(booking, req.user)) {
            payload.exactAddress = booking.exactAddress;
        }

        if(booking.status === "active" && hasTracking(booking)) {
            payload.tracking = booking.tracking;
        }

        logWorkerPiiLeakCheck(payload, req, booking);
        return payload;
    }

    if(req.user.role === "woman") {
        const isOwner = String(booking.woman?._id || booking.woman) === req.user.userId;
        const payload = {
            ...base,
            worker: booking.worker ? workerSummary(booking.worker) : undefined
        };

        if(isOwner) {
            payload.exactAddress = booking.exactAddress;
        }

        if(["active", "completed"].includes(booking.status) && hasTracking(booking)) {
            payload.tracking = booking.tracking;
        }

        if(booking.status === "accepted" && booking.worker) {
            payload.notification = {
                type: "booking_confirmed",
                message: "Booking confirmed",
                confirmedTimeWindow: booking.timeWindow,
                worker: workerSummary(booking.worker)
            };
        }

        if(booking.status === "active" && booking.worker) {
            payload.notification = {
                type: "service_active",
                message: "Service is active. You can track the worker in-app.",
                worker: workerSummary(booking.worker)
            };
        }

        if(booking.status === "rejected") {
            payload.notification = {
                type: "booking_rejected",
                message: "Request was not accepted. You can rebook with another worker."
            };
        }

        return payload;
    }

    return booking;
};

export const createBooking = async (req, res) => {
    try {
        if(req.user.role !== "woman") {
            return res.status(403).json({
                message: "Only women can request a booking",
                success: false
            });
        }

        const { workerId, taskType, scheduledFor, timeWindow, problem, quotation, area, exactAddress, notes = "" } = req.body;

        if(!workerId || !taskType || !scheduledFor || !timeWindow || !problem || !quotation || !area || !exactAddress) {
            return res.status(400).json({
                message: "Worker, task type, date/time, problem, quotation, area, time window, and exact address are required",
                success: false
            });
        }

        const [woman, worker] = await Promise.all([
            User.findById(req.user.userId),
            User.findById(workerId).select(workerPublicFields)
        ]);

        if(!woman || woman.role !== "woman") {
            return res.status(404).json({
                message: "Woman profile not found",
                success: false
            });
        }

        if(!worker || worker.role !== "worker") {
            return res.status(400).json({
                message: "Selected person is not a worker",
                success: false
            });
        }

        if(worker.locality !== woman.locality) {
            return res.status(400).json({
                message: "Worker is not from your locality",
                success: false
            });
        }

        const booking = await Booking.create({
            woman: woman._id,
            worker: worker._id,
            taskType,
            scheduledFor: new Date(scheduledFor),
            timeWindow,
            problem,
            quotation,
            area,
            exactAddress,
            notes
        });

        await booking.populate("worker", workerPublicFields);

        return res.status(201).json({
            message: "Booking request sent",
            success: true,
            booking: serializeBooking(booking, req)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not send booking request",
            success: false
        });
    }
};

export const getBookings = async (req, res) => {
    try {
        const filter = req.user.role === "worker"
            ? { worker: req.user.userId }
            : { woman: req.user.userId };

        if(req.query.status && bookingStatuses.includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const query = Booking.find(filter).sort({ scheduledFor: 1, createdAt: -1 }).select("+exactAddress");

        if(req.user.role === "woman") {
            query.populate("worker", workerPublicFields);
        }

        const bookings = await query;

        return res.status(200).json({
            message: "Bookings fetched",
            success: true,
            bookings: bookings.map((booking) => serializeBooking(booking, req))
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not fetch bookings",
            success: false
        });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        if(req.user.role !== "worker") {
            return res.status(403).json({
                message: "Only workers can accept or reject booking requests",
                success: false
            });
        }

        const { status } = req.body;

        if(!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Booking can only be accepted or rejected",
                success: false
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.bookingId,
            worker: req.user.userId,
            status: "pending"
        }).select("+exactAddress");

        if(!booking) {
            return res.status(404).json({
                message: "Pending booking request not found",
                success: false
            });
        }

        booking.status = status;
        booking.acceptedAt = status === "accepted" ? new Date() : null;
        booking.rejectedAt = status === "rejected" ? new Date() : null;
        await booking.save();

        return res.status(200).json({
            message: status === "accepted" ? "Booking accepted" : "Booking rejected",
            success: true,
            booking: serializeBooking(booking, req)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not update booking",
            success: false
        });
    }
};

export const startBookingService = async (req, res) => {
    try {
        if(req.user.role !== "worker") {
            return res.status(403).json({
                message: "Only workers can start a service",
                success: false
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.bookingId,
            worker: req.user.userId,
            status: "accepted"
        }).select("+exactAddress");

        if(!booking) {
            return res.status(404).json({
                message: "Accepted booking not found",
                success: false
            });
        }

        booking.status = "active";
        booking.activeAt = new Date();
        await booking.save();

        return res.status(200).json({
            message: "Service started",
            success: true,
            booking: serializeBooking(booking, req)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not start service",
            success: false
        });
    }
};

export const updateBookingTracking = async (req, res) => {
    try {
        if(req.user.role !== "worker") {
            return res.status(403).json({
                message: "Only workers can update service tracking",
                success: false
            });
        }

        const { latitude, longitude } = req.body;

        if(latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                message: "Latitude and longitude are required",
                success: false
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.bookingId,
            worker: req.user.userId,
            status: "active"
        }).select("+exactAddress");

        if(!booking) {
            return res.status(404).json({
                message: "Active booking not found",
                success: false
            });
        }

        booking.tracking = {
            latitude: Number(latitude),
            longitude: Number(longitude),
            updatedAt: new Date()
        };
        await booking.save();

        return res.status(200).json({
            message: "Tracking updated",
            success: true,
            booking: serializeBooking(booking, req)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not update tracking",
            success: false
        });
    }
};

export const completeBooking = async (req, res) => {
    try {
        if(req.user.role !== "woman") {
            return res.status(403).json({
                message: "Only the woman who booked can complete a service",
                success: false
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.bookingId,
            woman: req.user.userId,
            status: { $in: ["accepted", "active"] }
        }).select("+exactAddress").populate("worker", workerPublicFields);

        if(!booking) {
            return res.status(404).json({
                message: "Accepted booking not found",
                success: false
            });
        }

        booking.status = "completed";
        booking.completedAt = new Date();
        await booking.save();

        return res.status(200).json({
            message: "Service marked complete. You can now rate the worker.",
            success: true,
            booking: serializeBooking(booking, req)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not complete booking",
            success: false
        });
    }
};
