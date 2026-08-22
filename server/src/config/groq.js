import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

export const SAFETY_MODEL = "llama-3.3-70b-versatile";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export default groq;
