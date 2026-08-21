import mongoose from "mongoose";

const opportunitySchema = new mongoose.Schema(
    {
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        locality: {
            type: String,
            required: true,
            trim: true
        },
        pay: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            default: "custom",
            trim: true
        },
        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open"
        }
    },
    {
        timestamps: true
    }
);

opportunitySchema.index({ locality: 1, status: 1, createdAt: -1 });
opportunitySchema.index({ title: "text", description: "text", category: "text" });

const Opportunity = mongoose.model("Opportunity", opportunitySchema);

export default Opportunity;
