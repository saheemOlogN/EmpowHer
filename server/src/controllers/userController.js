import mongoose from "mongoose";
import User from "../models/User.js";
import Connection from "../models/Connection.js";

export const getDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;

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

export const updateLocation = async (req, res) => {
    try {
        const { userId } = req.params;
        const { latitude, longitude } = req.body;

        if(userId !== req.user.userId) {
            return res.status(403).json({
                message: "You can only update your own location",
                success: false
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { latitude, longitude },
            { new: true }
        );

        return res.status(200).json({
            message: "Location updated",
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not update location",
            success: false
        });
    }
};

export const shareLocation = async (req, res) => {
    try {
        const { userId } = req.params;
        const { shareWithUserIds = [], durationMinutes = 60 } = req.body;

        if(userId !== req.user.userId) {
            return res.status(403).json({
                message: "You can only share your own location",
                success: false
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                sharingWith: shareWithUserIds,
                sharingExpiresAt: shareWithUserIds.length
                    ? new Date(Date.now() + Number(durationMinutes) * 60 * 1000)
                    : null
            },
            { new: true }
        );

        return res.status(200).json({
            message: shareWithUserIds.length ? "Live location sharing is on" : "Live location sharing is off",
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not update sharing",
            success: false
        });
    }
};

export const getSharedLocations = async (req, res) => {
    try {
        const acceptedConnections = await Connection.find({
            status: "accepted",
            $or: [
                { requester: req.user.userId },
                { recipient: req.user.userId }
            ]
        });

        const connectedIds = acceptedConnections.map((connection) => (
            String(connection.requester) === req.user.userId ? connection.recipient : connection.requester
        ));

        const users = await User.find({
            _id: { $in: connectedIds },
            sharingWith: req.user.userId,
            sharingExpiresAt: { $gt: new Date() },
            latitude: { $ne: null },
            longitude: { $ne: null }
        }).select("name locality latitude longitude sharingExpiresAt");

        return res.status(200).json({
            message: "Shared locations fetched",
            success: true,
            locations: users
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not fetch shared locations",
            success: false
        });
    }
};
