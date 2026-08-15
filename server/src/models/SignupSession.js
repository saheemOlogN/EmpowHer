import mongoose from "mongoose";

const signupSessionSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            unique: true
        },
        code: {
            type: String,
            required: true
        },
        otpVerified: {
            type: Boolean,
            default: false
        },
        identityPending: {
            type: Boolean,
            default: false
        },
        identityVerified: {
            type: Boolean,
            default: false
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }
        }
    },
    {
        timestamps: true
    }
);

const SignupSession = mongoose.model("SignupSession", signupSessionSchema);

export default SignupSession;
