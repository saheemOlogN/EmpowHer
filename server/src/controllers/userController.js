import mongoose from "mongoose";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import Alert from "../models/Alert.js";
import Experience from "../models/Experience.js";
import Opportunity from "../models/Opportunity.js";

const publicWomanFields = "name locality role profession maritalStatus identityVerified";
const workerFields = "name locality role workType profession safetyRating ratingCount idVerified identityVerified";
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeLocation = (location = {}) => ({
    pincode: String(location.pincode || "").trim(),
    area: String(location.area || "").trim(),
    district: String(location.district || "").trim(),
    state: String(location.state || "").trim()
});
const formatLocality = (location = {}) => {
    const normalized = normalizeLocation(location);
    const label = [normalized.area, normalized.district, normalized.state].filter(Boolean).join(", ");
    return label && normalized.pincode ? `${label} - ${normalized.pincode}` : "";
};

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

        if(user.role === "worker") {
            return res.status(200).json({
                message:"Worker session fetched",
                success:true,
                user,
                womenNearby: [],
                workersNearby: []
            });
        }

        const womenNearby = user.role === "woman"
            ? await User.find({
                _id: { $ne: user._id },
                role: "woman",
                locality: user.locality
            }).select(publicWomanFields)
            : [];

        const workersNearby = await User.find({
            role: "worker",
            locality: user.locality
        }).select(workerFields);

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

export const updateLocality = async (req, res) => {
    try {
        const { userId } = req.params;
        const { locality, location, latitude = null, longitude = null } = req.body;

        if(userId !== req.user.userId) {
            return res.status(403).json({
                message: "You can only update your own locality",
                success: false
            });
        }

        const normalizedLocation = normalizeLocation(location);
        const normalizedLocality = formatLocality(normalizedLocation) || locality;

        if(!normalizedLocality) {
            return res.status(400).json({
                message: "Locality is required",
                success: false
            });
        }

        if(!/^\d{6}$/.test(normalizedLocation.pincode) || !normalizedLocation.area || !normalizedLocation.district || !normalizedLocation.state) {
            return res.status(400).json({
                message: "Confirm your locality from a valid 6 digit PIN code",
                success: false
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                locality: normalizedLocality,
                location: normalizedLocation,
                latitude,
                longitude,
                sharingWith: [],
                sharingExpiresAt: null
            },
            { new: true }
        );

        return res.status(200).json({
            message: `Locality changed to ${normalizedLocality}`,
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not update locality",
            success: false
        });
    }
};

export const searchPeople = async (req, res) => {
    try {
        if(req.user.role !== "woman") {
            return res.status(403).json({
                message: "Workers cannot search or contact women on EmpowHer",
                success: false,
                people: []
            });
        }

        const user = await User.findById(req.user.userId);
        const search = (req.query.search || "").trim();
        const locality = req.query.locality || user.locality;
        const filter = {
            _id: { $ne: user._id },
            role: "woman",
            locality
        };

        if(search) {
            const pattern = new RegExp(escapeRegex(search), "i");
            filter.$or = [
                { name: pattern },
                { profession: pattern },
                { maritalStatus: pattern }
            ];
        }

        const people = await User.find(filter).select(publicWomanFields).sort({ name: 1 });

        return res.status(200).json({
            message: "People fetched",
            success: true,
            people
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not search people",
            success: false
        });
    }
};

export const getLocalitySummary = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.userId);

        if(currentUser.role !== "woman") {
            return res.status(403).json({
                message: "Workers can only access requests and ratings",
                success: false,
                summary: null
            });
        }

        const locality = req.query.locality || currentUser.locality;
        const [womenCount, workerCount, activeAlerts, experiences, opportunities, professions] = await Promise.all([
            User.countDocuments({ role: "woman", locality }),
            User.countDocuments({ role: "worker", locality }),
            Alert.countDocuments({ locality, status: "active" }),
            Experience.find({ locality }).sort({ createdAt: -1 }).limit(3).select("title category createdAt"),
            Opportunity.find({ locality, status: "open" }).sort({ createdAt: -1 }).limit(4).select("title pay category createdAt"),
            User.aggregate([
                { $match: { role: "woman", locality, profession: { $nin: ["", null] } } },
                { $group: { _id: "$profession", count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } },
                { $limit: 6 }
            ])
        ]);

        return res.status(200).json({
            message: "Locality summary fetched",
            success: true,
            summary: {
                locality,
                womenCount,
                workerCount,
                activeAlerts,
                recentExperiences: experiences,
                openOpportunities: opportunities,
                professions: professions.map((item) => ({ title: item._id, count: item.count })),
                canSearchWomen: req.user.role === "woman"
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not fetch locality summary",
            success: false
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

        if(req.user.role !== "woman" && shareWithUserIds.length) {
            return res.status(403).json({
                message: "Workers cannot share live location with women through EmpowHer",
                success: false
            });
        }

        const acceptedConnections = await Connection.find({
            status: "accepted",
            $or: [
                { requester: req.user.userId },
                { recipient: req.user.userId }
            ]
        });

        const allowedIds = new Set(acceptedConnections.map((connection) => (
            String(connection.requester) === req.user.userId ? String(connection.recipient) : String(connection.requester)
        )));
        const safeShareIds = shareWithUserIds.filter((id) => allowedIds.has(String(id)));

        const user = await User.findByIdAndUpdate(
            userId,
            {
                sharingWith: safeShareIds,
                sharingExpiresAt: safeShareIds.length
                    ? new Date(Date.now() + Number(durationMinutes) * 60 * 1000)
                    : null
            },
            { new: true }
        );

        return res.status(200).json({
            message: safeShareIds.length ? "Live location sharing is on" : "Live location sharing is off",
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
        if(req.user.role !== "woman") {
            return res.status(200).json({
                message: "Workers cannot access women's shared locations",
                success: true,
                locations: []
            });
        }

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
