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

workerRatingSchema.index({ worker: 1, ratedBy: 1 }, { unique: true });

const WorkerRating = mongoose.model("WorkerRating", workerRatingSchema);

export default WorkerRating;
