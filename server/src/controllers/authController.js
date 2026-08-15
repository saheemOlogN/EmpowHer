import mongoose from "mongoose";
import User from "../models/User.js";

export const loginUser = async (req, res) => {
    try {
        const { name, phone, role, gender, workType, locality, latitude, longitude } = req.body;

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

        return res.status(200).json({
            message:"Login successful",
            success:true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            message:"Login failed",
            success:false
        });
    }
};
