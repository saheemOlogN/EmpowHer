import Alert from "../models/Alert.js";
import User from "../models/User.js";

export const createAlert = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const { type, description, latitude, longitude, locality } = req.body;

        if(!type || !description) {
            return res.status(400).json({
                message: "Alert type and description are required",
                success: false
            });
        }

        const alert = await Alert.create({
            raisedBy: user._id,
            locality: locality || user.locality,
            latitude: latitude ?? user.latitude,
            longitude: longitude ?? user.longitude,
            type,
            description
        });

        await alert.populate("raisedBy", "name locality");

        return res.status(201).json({
            message: "Alert raised",
            success: true,
            alert
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not raise alert",
            success: false
        });
    }
};

export const getAlerts = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const locality = req.query.locality || user.locality;
        const alerts = await Alert.find({ locality })
            .populate("raisedBy", "name locality")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Alerts fetched",
            success: true,
            alerts
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not fetch alerts",
            success: false
        });
    }
};

export const resolveAlert = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.alertId);

        if(!alert) {
            return res.status(404).json({
                message: "Alert not found",
                success: false
            });
        }

        if(String(alert.raisedBy) !== req.user.userId) {
            return res.status(403).json({
                message: "Only the person who raised this alert can resolve it",
                success: false
            });
        }

        alert.status = "resolved";
        await alert.save();
        await alert.populate("raisedBy", "name locality");

        return res.status(200).json({
            message: "Alert resolved",
            success: true,
            alert
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not resolve alert",
            success: false
        });
    }
};
