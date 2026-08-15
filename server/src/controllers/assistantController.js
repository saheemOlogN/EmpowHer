import Groq from "groq-sdk";

const systemPrompt = "You are a calm, practical safety assistant inside a hyperlocal safety app for women in India. Give short, actionable guidance for questions about safety, local services, or emergency situations. Never give medical or legal advice - point to relevant professionals or emergency services (police: 100, women's helpline: 1091) when appropriate. Keep responses under 120 words.";

export const askAssistant = async (req, res) => {
    try {
        const { message, locality } = req.body;

        if(!message) {
            return res.status(400).json({
                message: "Ask a question first",
                success: false
            });
        }

        if(!process.env.GROQ_API_KEY) {
            return res.status(200).json({
                message: "Assistant is running in demo mode",
                success: true,
                reply: `For ${locality || "your area"}, stay in a public place, share your live location with a trusted connection, and call 100 or 1091 if you feel at immediate risk.`
            });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Locality: ${locality || "unknown"}\nQuestion: ${message}` }
            ],
            temperature: 0.3,
            max_tokens: 180
        });

        return res.status(200).json({
            message: "Assistant response ready",
            success: true,
            reply: completion.choices[0]?.message?.content || "I could not prepare a response just now."
        });
    } catch (error) {
        return res.status(500).json({
            message: "Assistant could not respond",
            success: false
        });
    }
};
