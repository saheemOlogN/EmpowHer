import mongoose from "mongoose";

const workerRatingSchema = new mongoose.Schema(
    {
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        ratedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        rating: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const WorkerRating = mongoose.model("WorkerRating", workerRatingSchema);

export default WorkerRating;
