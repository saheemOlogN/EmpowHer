import Checkin from "../models/Checkin.js";
import Connection from "../models/Connection.js";

const getConnectedIds = async (userId) => {
    const connections = await Connection.find({
        status: "accepted",
        $or: [
            { requester: userId },
            { recipient: userId }
        ]
    });

    return connections.map((connection) => (
        String(connection.requester) === userId ? connection.recipient : connection.requester
    ));
};

export const startCheckin = async (req, res) => {
    try {
        const { destination, durationMinutes = 60 } = req.body;

        if(!destination) {
            return res.status(400).json({
                message: "Enter a destination for your check-in",
                success: false
            });
        }

        const connectedIds = await getConnectedIds(req.user.userId);
        const checkin = await Checkin.create({
            user: req.user.userId,
            destination,
            expectedBy: new Date(Date.now() + Number(durationMinutes) * 60 * 1000),
            notifiedConnections: connectedIds
        });

        await checkin.populate("user", "name locality");

        return res.status(201).json({
            message: "Check-in started",
            success: true,
            checkin
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not start check-in",
            success: false
        });
    }
};

export const confirmArrival = async (req, res) => {
    try {
        const checkin = await Checkin.findOneAndUpdate(
            {
                _id: req.params.checkinId,
                user: req.user.userId
            },
            { status: "arrived" },
            { new: true }
        ).populate("user", "name locality");

        if(!checkin) {
            return res.status(404).json({
                message: "Check-in not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Arrived safely",
            success: true,
            checkin
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not confirm arrival",
            success: false
        });
    }
};

export const getActiveCheckins = async (req, res) => {
    try {
        const checkins = await Checkin.find({
            user: req.user.userId,
            status: "pending"
        }).populate("user", "name locality").sort({ expectedBy: 1 });

        return res.status(200).json({
            message: "Active check-ins fetched",
            success: true,
            checkins
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not fetch check-ins",
            success: false
        });
    }
};

export const getCheckinsToWatch = async (req, res) => {
    try {
        const connectedIds = await getConnectedIds(req.user.userId);
        const checkins = await Checkin.find({
            user: { $in: connectedIds },
            notifiedConnections: req.user.userId,
            status: { $in: ["pending", "overdue"] },
            expectedBy: { $lt: new Date() }
        }).populate("user", "name locality").sort({ expectedBy: 1 });

        return res.status(200).json({
            message: "Watched check-ins fetched",
            success: true,
            checkins
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not fetch watched check-ins",
            success: false
        });
    }
};

export const markOverdue = async (req, res) => {
    try {
        const connectedIds = await getConnectedIds(req.user.userId);
        const checkin = await Checkin.findOneAndUpdate(
            {
                _id: req.params.checkinId,
                user: { $in: connectedIds },
                status: "pending",
                expectedBy: { $lt: new Date() }
            },
            { status: "overdue" },
            { new: true }
        ).populate("user", "name locality");

        if(!checkin) {
            return res.status(404).json({
                message: "Check-in not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Check-in marked overdue",
            success: true,
            checkin
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not update check-in",
            success: false
        });
    }
};
