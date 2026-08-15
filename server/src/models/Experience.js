import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
    {
        sharedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        locality: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ["safety_tip", "positive_experience", "warning", "general"],
            default: "general"
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    {
        timestamps: true
    }
);

const Experience = mongoose.model("Experience", experienceSchema);

export default Experience;
