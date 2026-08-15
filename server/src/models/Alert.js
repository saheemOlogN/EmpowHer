import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
    {
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        locality: {
            type: String,
            required: true
        },
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        },
        type: {
            type: String,
            enum: ["unsafe_area", "harassment", "suspicious_activity", "other"],
            required: true
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["active", "resolved"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
