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
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true,
            select: false
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
        profession: {
            type: String,
            default: ""
        },
        maritalStatus: {
            type: String,
            enum: ["single", "married", "widowed", "separated", "prefer_not_to_say", ""],
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
        },
        identityVerified: {
            type: Boolean,
            default: false
        },
        identityVerifiedAt: {
            type: Date,
            default: null
        },
        idVerificationRequested: {
            type: Boolean,
            default: false
        },
        idVerified: {
            type: Boolean,
            default: false
        },
        sharingWith: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        sharingExpiresAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

userSchema.virtual("isRecommended").get(function getIsRecommended() {
    return this.ratingCount >= 5 && this.safetyRating >= 4.5;
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;
