import Experience from "../models/Experience.js";
import User from "../models/User.js";

const populateExperience = (query) => query.populate("sharedBy", "name locality").sort({ createdAt: -1 });

export const createExperience = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const { title, content, category = "general" } = req.body;

        if(!title || !content) {
            return res.status(400).json({
                message: "Title and experience are required",
                success: false
            });
        }

        const experience = await Experience.create({
            sharedBy: user._id,
            locality: user.locality,
            title,
            content,
            category
        });

        await experience.populate("sharedBy", "name locality");

        return res.status(201).json({
            message: "Experience shared",
            success: true,
            experience
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not share experience",
            success: false
        });
    }
};

export const getExperiences = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const filter = req.query.all === "true" ? {} : { locality: req.query.locality || user.locality };
        const experiences = await populateExperience(Experience.find(filter));

        return res.status(200).json({
            message: "Experiences fetched",
            success: true,
            experiences
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not fetch experiences",
            success: false
        });
    }
};

export const toggleLike = async (req, res) => {
    try {
        const experience = await Experience.findById(req.params.experienceId);

        if(!experience) {
            return res.status(404).json({
                message: "Experience not found",
                success: false
            });
        }

        const liked = experience.likes.some((id) => String(id) === req.user.userId);
        experience.likes = liked
            ? experience.likes.filter((id) => String(id) !== req.user.userId)
            : [...experience.likes, req.user.userId];

        await experience.save();
        await experience.populate("sharedBy", "name locality");

        return res.status(200).json({
            message: liked ? "Like removed" : "Experience liked",
            success: true,
            experience
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not update like",
            success: false
        });
    }
};
