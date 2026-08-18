import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if(!process.env.MONGODB_URI) {
            console.log("MongoDB URI missing. Add MONGODB_URI in .env");
            return false;
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 8000
        });
        console.log("MongoDB connected");
        return true;
    } catch (error) {
        console.log("MongoDB connection error", error.message);
        return false;
    }
};

export default connectDB;
