import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if(!process.env.MONGODB_URI) {
            console.log("MongoDB URI missing. Add MONGODB_URI in .env");
            return;
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.log("MongoDB connection error", error.message);
    }
};

export default connectDB;
