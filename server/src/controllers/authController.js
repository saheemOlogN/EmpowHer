import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Otp from "../models/Otp.js";
import User from "../models/User.js";

const signToken = (user) => jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || "empowher-demo-secret",
    { expiresIn: "7d" }
);

export const sendOtp = async (req, res) => {
    try {
        const { name, phone, role, gender, locality } = req.body;

        if(mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message:"Database is not connected",
                success:false
            });
        }

        if(!name || !phone || !role || !gender || !locality) {
            return res.status(400).json({
                message:"Please fill all required fields",
                success:false
            });
        }

        if(role !== "woman" && role !== "worker") {
            return res.status(400).json({
                message:"Invalid login type",
                success:false
            });
        }

        if(role === "woman" && gender !== "female") {
            return res.status(400).json({
                message:"User login is only available for women",
                success:false
            });
        }

        const code = String(Math.floor(1000 + Math.random() * 9000));

        await Otp.findOneAndUpdate(
            { phone },
            {
                phone,
                code,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Demo only: return the OTP so judges can sign in without an SMS provider.
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
        const { name, phone, role, gender, workType, locality, latitude, longitude, code } = req.body;

        if(mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message:"Database is not connected",
                success:false
            });
        }

        if(!phone || !code) {
            return res.status(400).json({
                message:"Enter the 4 digit code",
                success:false
            });
        }

        const otp = await Otp.findOne({ phone });

        if(!otp || otp.code !== code || otp.expiresAt < new Date()) {
            return res.status(400).json({
                message:"Couldn't verify that code - check the 4 digits and try again",
                success:false
            });
        }

        let user = await User.findOne({ phone });

        if(user) {
            user.name = name;
            user.role = role;
            user.gender = gender;
            user.workType = workType || "";
            user.locality = locality;
            user.latitude = latitude || null;
            user.longitude = longitude || null;

            await user.save();
        } else {
            user = await User.create({
                name,
                phone,
                role,
                gender,
                workType: workType || "",
                locality,
                latitude: latitude || null,
                longitude: longitude || null
            });
        }

        await Otp.deleteOne({ phone });

        return res.status(200).json({
            message:"Login successful",
            success:true,
            token: signToken(user),
            user
        });
    } catch (error) {
        return res.status(500).json({
            message:"Login failed",
            success:false
        });
    }
};
