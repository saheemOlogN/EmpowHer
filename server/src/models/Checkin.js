import mongoose from "mongoose";

const checkinSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        destination: {
            type: String,
            required: true
        },
        expectedBy: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "arrived", "overdue"],
            default: "pending"
        },
        notifiedConnections: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    {
        timestamps: true
    }
);

const Checkin = mongoose.model("Checkin", checkinSchema);

export default Checkin;
