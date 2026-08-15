import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true,
            unique: true
        },
        role: {
            type: String,
            enum: ["woman", "worker"],
            required: true
        },
        gender: {
            type: String,
            enum: ["female", "male", "other"],
            required: true
        },
        workType: {
            type: String,
            default: ""
        },
        locality: {
            type: String,
            required: true
        },
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        },
        safetyRating: {
            type: Number,
            default: 0
        },
        ratingCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;
