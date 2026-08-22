import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import alertRoutes from "./routes/alertRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import checkinRoutes from "./routes/checkinRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";
import experienceRoutes from "./routes/experienceRoutes.js";
import opportunityRoutes from "./routes/opportunityRoutes.js";
import safetyRoutes from "./routes/safetyRoutes.js";
import schemeRoutes from "./routes/schemeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;

    return res.status(200).json({
        message:"EmpowHer API is running",
        databaseConnected,
        success:true
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/safety", safetyRoutes);
app.use("/api/schemes", schemeRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/checkins", checkinRoutes);

app.use(errorMiddleware);

export default app;
