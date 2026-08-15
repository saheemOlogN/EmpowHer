import cors from "cors";
import express from "express";
import alertRoutes from "./routes/alertRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";
import experienceRoutes from "./routes/experienceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    return res.status(200).json({
        message:"EmpowHer API is running",
        success:true
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/assistant", assistantRoutes);

app.use(errorMiddleware);

export default app;
