import Opportunity from "../models/Opportunity.js";
import User from "../models/User.js";

const publicOpportunityFields = "title description locality pay category status createdAt updatedAt";
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createOpportunity = async (req, res) => {
    try {
        if(req.user.role !== "woman") {
            return res.status(403).json({
                message: "Only women can open local opportunities",
                success: false
            });
        }

        const user = await User.findById(req.user.userId);
        const { title, description, pay, category = "custom" } = req.body;

        if(!title || !description || !pay) {
            return res.status(400).json({
                message: "Title, task details, and pay are required",
                success: false
            });
        }

        const opportunity = await Opportunity.create({
            postedBy: user._id,
            title,
            description,
            pay,
            category,
            locality: user.locality
        });

        return res.status(201).json({
            message: "Opportunity opened for your locality",
            success: true,
            opportunity
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not open opportunity",
            success: false
        });
    }
};

export const getOpportunities = async (req, res) => {
    try {
        if(req.user.role !== "woman") {
            return res.status(403).json({
                message: "Workers can only access requests and ratings",
                success: false,
                opportunities: []
            });
        }

        const user = await User.findById(req.user.userId);
        const search = (req.query.search || "").trim();
        const locality = req.query.locality || user.locality;
        const filter = {
            locality,
            status: req.query.status || "open"
        };

        if(search) {
            const pattern = new RegExp(escapeRegex(search), "i");
            filter.$or = [
                { title: pattern },
                { description: pattern },
                { category: pattern }
            ];
        }

        const query = Opportunity.find(filter).sort({ createdAt: -1 });

        query.populate("postedBy", "name locality profession maritalStatus");

        const opportunities = await query;

        return res.status(200).json({
            message: "Opportunities fetched",
            success: true,
            opportunities
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not fetch opportunities",
            success: false
        });
    }
};

export const closeOpportunity = async (req, res) => {
    try {
        const opportunity = await Opportunity.findOne({
            _id: req.params.opportunityId,
            postedBy: req.user.userId
        });

        if(!opportunity) {
            return res.status(404).json({
                message: "Opportunity not found",
                success: false
            });
        }

        opportunity.status = "closed";
        await opportunity.save();

        return res.status(200).json({
            message: "Opportunity closed",
            success: true,
            opportunity
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not close opportunity",
            success: false
        });
    }
};
