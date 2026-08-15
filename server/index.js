import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const port = process.env.PORT || 4000;

connectDB();

app.listen(port, () => {
    console.log(`EmpowHer API listening on http://127.0.0.1:${port}`);
});
