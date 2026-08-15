import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import SignupSession from "../models/SignupSession.js";
import User from "../models/User.js";

const signToken = (user) => jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || "empowher-demo-secret",
    { expiresIn: "7d" }
);

const publicUser = (user) => {
    const payload = user.toObject ? user.toObject() : user;
    delete payload.passwordHash;
    return payload;
};

const validateSignupBasics = ({ name, phone, email, password, role, gender, locality }) => {
    if(!name || !phone || !email || !password || !role || !gender || !locality) {
        return "Please fill all required fields";
    }

    if(role !== "woman" && role !== "worker") {
        return "Invalid account type";
    }

    if(role === "woman" && gender !== "female") {
        return "Women community accounts must use female as gender";
    }

    return "";
};

export const sendOtp = async (req, res) => {
    try {
        const { name, phone, email, password, role, gender, locality } = req.body;

        if(mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: "Database is not connected", success: false });
        }

        const validationMessage = validateSignupBasics({ name, phone, email, password, role, gender, locality });

        if(validationMessage) {
            return res.status(400).json({ message: validationMessage, success: false });
        }

        const existing = await User.findOne({ $or: [{ phone }, { email: email.toLowerCase() }] });

        if(existing) {
            return res.status(409).json({
                message: "An account already exists for this phone or email",
                success: false
            });
        }

        const code = String(Math.floor(1000 + Math.random() * 9000));

        await SignupSession.findOneAndUpdate(
            { phone },
            {
                phone,
                code,
                otpVerified: false,
                identityPending: false,
                identityVerified: false,
                expiresAt: new Date(Date.now() + 20 * 60 * 1000)
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Demo only: return the OTP so judges can sign up without an SMS provider.
        // Replace this response field with a real SMS provider before production.
        return res.status(200).json({
            message: "Verification code sent",
            success: true,
            otp: code
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not send verification code",
            success: false
        });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { phone, code } = req.body;

        if(!phone || !code) {
            return res.status(400).json({
                message: "Enter the 4 digit code",
                success: false
            });
        }

        const session = await SignupSession.findOne({ phone });

        if(!session || session.code !== code || session.expiresAt < new Date()) {
            return res.status(400).json({
                message: "Couldn't verify that code - check the 4 digits and try again",
                success: false
            });
        }

        session.otpVerified = true;
        await session.save();

        return res.status(200).json({
            message: "Phone verified",
            success: true,
            otpVerified: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not verify phone",
            success: false
        });
    }
};

export const simulateIdentityCheck = async (req, res) => {
    try {
        const { phone } = req.body;
        const session = await SignupSession.findOne({ phone });

        if(!session || !session.otpVerified) {
            return res.status(400).json({
                message: "Verify your phone before identity check",
                success: false
            });
        }

        session.identityPending = true;
        await session.save();

        await new Promise((resolve) => setTimeout(resolve, 700));

        // Demo only: production should use DigiLocker verification and never store ID documents.
        session.identityPending = false;
        session.identityVerified = true;
        await session.save();

        return res.status(200).json({
            message: "Identity confirmed",
            success: true,
            verified: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Could not run identity check",
            success: false
        });
    }
};

export const completeSignup = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            password,
            role,
            gender,
            workType,
            locality,
            latitude,
            longitude
        } = req.body;

        if(mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: "Database is not connected", success: false });
        }

        const validationMessage = validateSignupBasics({ name, phone, email, password, role, gender, locality });

        if(validationMessage) {
            return res.status(400).json({ message: validationMessage, success: false });
        }

        const session = await SignupSession.findOne({ phone });

        if(!session || !session.otpVerified || session.expiresAt < new Date()) {
            return res.status(400).json({
                message: "Verify your phone before completing signup",
                success: false
            });
        }

        if(role === "woman" && !session.identityVerified) {
            return res.status(400).json({
                message: "Run the demo identity check before completing signup",
                success: false
            });
        }

        const existing = await User.findOne({ $or: [{ phone }, { email: email.toLowerCase() }] });

        if(existing) {
            return res.status(409).json({
                message: "An account already exists for this phone or email",
                success: false
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name,
            phone,
            email: email.toLowerCase(),
            passwordHash,
            role,
            gender,
            workType: workType || "",
            locality,
            latitude: latitude || null,
            longitude: longitude || null,
            identityVerified: role === "woman",
            identityVerifiedAt: role === "woman" ? new Date() : null
        });

        await SignupSession.deleteOne({ phone });

        return res.status(201).json({
            message: "Account created",
            success: true,
            token: signToken(user),
            user: publicUser(user)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Signup failed",
            success: false
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({
                message: "Incorrect email or password",
                success: false
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");

        if(!user) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false
            });
        }

        const matches = await bcrypt.compare(password, user.passwordHash);

        if(!matches) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false
            });
        }

        return res.status(200).json({
            message: "Signed in",
            success: true,
            token: signToken(user),
            user: publicUser(user)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Signin failed",
            success: false
        });
    }
};
