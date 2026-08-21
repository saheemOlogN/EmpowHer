import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        woman: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        taskType: {
            type: String,
            required: true,
            trim: true
        },
        scheduledFor: {
            type: Date,
            required: true
        },
        timeWindow: {
            type: String,
            required: true,
            trim: true
        },
        problem: {
            type: String,
            required: true,
            trim: true
        },
        quotation: {
            type: String,
            required: true,
            trim: true
        },
        area: {
            type: String,
            required: true,
            trim: true
        },
        exactAddress: {
            type: String,
            required: true,
            trim: true,
            select: false
        },
        notes: {
            type: String,
            default: "",
            trim: true
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "active", "completed"],
            default: "pending",
            index: true
        },
        acceptedAt: {
            type: Date,
            default: null
        },
        rejectedAt: {
            type: Date,
            default: null
        },
        activeAt: {
            type: Date,
            default: null
        },
        tracking: {
            latitude: {
                type: Number,
                default: null
            },
            longitude: {
                type: Number,
                default: null
            },
            updatedAt: {
                type: Date,
                default: null
            }
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

bookingSchema.index({ worker: 1, status: 1, scheduledFor: 1 });
bookingSchema.index({ woman: 1, status: 1, scheduledFor: -1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
