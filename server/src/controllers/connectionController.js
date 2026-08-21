import Connection from "../models/Connection.js";
import User from "../models/User.js";

const connectionPopulateFields = "name locality role latitude longitude sharingExpiresAt";

const assertWomenOnlyConnection = async (requesterId, recipientId) => {
    const users = await User.find({ _id: { $in: [requesterId, recipientId] } }).select("role locality");
    const requester = users.find((user) => String(user._id) === String(requesterId));
    const recipient = users.find((user) => String(user._id) === String(recipientId));

    if(!requester || !recipient) {
        return "Choose a valid person to connect with";
    }

    if(requester.role !== "woman" || recipient.role !== "woman") {
        return "Connections are only available between women for safety";
    }

    if(requester.locality !== recipient.locality) {
        return "You can only connect with women in your locality";
    }

    return "";
};

export const sendRequest = async (req, res) => {
    try {
        const { recipientId } = req.body;

        if(!recipientId || recipientId === req.user.userId) {
            return res.status(400).json({
                message: "Choose someone else to connect with",
                success: false
            });
        }

        const policyMessage = await assertWomenOnlyConnection(req.user.userId, recipientId);

        if(policyMessage) {
            return res.status(403).json({
                message: policyMessage,
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
            await reverse.populate("requester recipient", connectionPopulateFields);

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
        ).populate("requester recipient", connectionPopulateFields);

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
        const pendingConnection = await Connection.findOne({
            _id: req.params.connectionId,
            recipient: req.user.userId,
            status: "pending"
        });

        if(!pendingConnection) {
            return res.status(404).json({
                message: "Request not found",
                success: false
            });
        }

        const policyMessage = await assertWomenOnlyConnection(pendingConnection.requester, pendingConnection.recipient);

        if(policyMessage) {
            await Connection.deleteOne({ _id: pendingConnection._id });

            return res.status(403).json({
                message: policyMessage,
                success: false
            });
        }

        const connection = await Connection.findOneAndUpdate(
            {
                _id: req.params.connectionId,
                recipient: req.user.userId,
                status: "pending"
            },
            { status: "accepted" },
            { new: true }
        ).populate("requester recipient", connectionPopulateFields);

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
        if(req.user.role !== "woman") {
            return res.status(200).json({
                message: "Workers cannot use personal connections",
                success: true,
                accepted: [],
                pendingIncoming: [],
                pendingOutgoing: []
            });
        }

        const connections = await Connection.find({
            $or: [
                { requester: req.user.userId },
                { recipient: req.user.userId }
            ]
        }).populate("requester recipient", connectionPopulateFields);

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
