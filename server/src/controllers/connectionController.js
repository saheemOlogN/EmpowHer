import Connection from "../models/Connection.js";

export const sendRequest = async (req, res) => {
    try {
        const { recipientId } = req.body;

        if(!recipientId || recipientId === req.user.userId) {
            return res.status(400).json({
                message: "Choose someone else to connect with",
                success: false
            });
        }

        const reverse = await Connection.findOne({
            requester: recipientId,
            recipient: req.user.userId
        });

        if(reverse) {
            reverse.status = reverse.status === "pending" ? "accepted" : reverse.status;
            await reverse.save();
            await reverse.populate("requester recipient", "name phone locality role latitude longitude sharingExpiresAt");

            return res.status(200).json({
                message: "Connected",
                success: true,
                connection: reverse
            });
        }

        const connection = await Connection.findOneAndUpdate(
            {
                requester: req.user.userId,
                recipient: recipientId
            },
            { status: "pending" },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).populate("requester recipient", "name phone locality role latitude longitude sharingExpiresAt");

        return res.status(200).json({
            message: "Connection requested",
            success: true,
            connection
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not send request",
            success: false
        });
    }
};

export const acceptRequest = async (req, res) => {
    try {
        const connection = await Connection.findOneAndUpdate(
            {
                _id: req.params.connectionId,
                recipient: req.user.userId,
                status: "pending"
            },
            { status: "accepted" },
            { new: true }
        ).populate("requester recipient", "name phone locality role latitude longitude sharingExpiresAt");

        if(!connection) {
            return res.status(404).json({
                message: "Request not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Connection accepted",
            success: true,
            connection
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not accept request",
            success: false
        });
    }
};

export const declineRequest = async (req, res) => {
    try {
        const connection = await Connection.findOneAndDelete({
            _id: req.params.connectionId,
            recipient: req.user.userId,
            status: "pending"
        });

        if(!connection) {
            return res.status(404).json({
                message: "Request not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Connection request declined",
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not decline request",
            success: false
        });
    }
};

export const getConnections = async (req, res) => {
    try {
        const connections = await Connection.find({
            $or: [
                { requester: req.user.userId },
                { recipient: req.user.userId }
            ]
        }).populate("requester recipient", "name phone locality role latitude longitude sharingExpiresAt");

        return res.status(200).json({
            message: "Connections fetched",
            success: true,
            accepted: connections.filter((item) => item.status === "accepted"),
            pendingIncoming: connections.filter((item) => item.status === "pending" && String(item.recipient._id) === req.user.userId),
            pendingOutgoing: connections.filter((item) => item.status === "pending" && String(item.requester._id) === req.user.userId)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not fetch connections",
            success: false
        });
    }
};
