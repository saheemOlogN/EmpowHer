import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        locality: {
            type: String,
            required: true,
            index: true
        },
        lat: {
            type: Number,
            default: null
        },
        lng: {
            type: Number,
            default: null
        },
        type: {
            type: String,
            enum: ["harassment", "theft", "poor_lighting", "stalking", "other"],
            required: true
        },
        severity: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
