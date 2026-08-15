import mongoose from "mongoose";
import User from "../models/User.js";

export const getDashboard = async (req, res) => {
    try {
        const { userId } = req.params;

        if(mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message:"Database is not connected",
                success:false
            });
        }

        const user = await User.findById(userId);

        if(!user) {
            return res.status(404).json({
                message:"User not found",
                success:false
            });
        }

        const womenNearby = await User.find({
            _id: { $ne: user._id },
            role: "woman",
            locality: user.locality
        }).select("-__v");

        const workersNearby = await User.find({
            role: "worker",
            locality: user.locality
        }).select("-__v");

        return res.status(200).json({
            message:"Dashboard data fetched",
            success:true,
            user,
            womenNearby,
            workersNearby
        });
    } catch (error) {
        return res.status(500).json({
            message:"Dashboard data failed",
            success:false
        });
    }
};
