import mongoose from "mongoose";
import User from "../models/User.js";
import WorkerRating from "../models/WorkerRating.js";

export const markWorkerSafe = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { rating } = req.body;
        const userId = req.user.userId;

        if(mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message:"Database is not connected",
                success:false
            });
        }

        if(!userId || !rating) {
            return res.status(400).json({
                message:"User and rating are required",
                success:false
            });
        }

        if(rating < 1 || rating > 5) {
            return res.status(400).json({
                message:"Rating should be between 1 and 5",
                success:false
            });
        }

        const woman = await User.findById(userId);

        if(!woman) {
            return res.status(404).json({
                message:"User not found",
                success:false
            });
        }

        if(woman.role !== "woman") {
            return res.status(403).json({
                message:"Only women can mark a worker safe",
                success:false
            });
        }

        const worker = await User.findById(workerId);

        if(!worker) {
            return res.status(404).json({
                message:"Worker not found",
                success:false
            });
        }

        if(worker.role !== "worker") {
            return res.status(400).json({
                message:"Selected person is not a worker",
                success:false
            });
        }

        if(worker.locality !== woman.locality) {
            return res.status(400).json({
                message:"Worker is not from your locality",
                success:false
            });
        }

        await WorkerRating.findOneAndUpdate(
            {
                worker: worker._id,
                ratedBy: woman._id
            },
            { rating: Number(rating) },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const summary = await WorkerRating.aggregate([
            { $match: { worker: worker._id } },
            {
                $group: {
                    _id: "$worker",
                    ratingCount: { $sum: 1 },
                    safetyRating: { $avg: "$rating" }
                }
            }
        ]);

        worker.ratingCount = summary[0]?.ratingCount || 0;
        worker.safetyRating = Number((summary[0]?.safetyRating || 0).toFixed(1));

        await worker.save();

        return res.status(200).json({
            message:"Worker marked safe",
            success:true,
            worker
        });
    } catch (error) {
        return res.status(500).json({
            message:"Could not mark worker safe",
            success:false
        });
    }
};
