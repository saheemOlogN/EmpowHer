import groq, { SAFETY_MODEL } from "../config/groq.js";
import { GOV_SCHEMES } from "../data/govSchemes.js";
import User from "../models/User.js";

const normalize = (value) => String(value || "").trim().toLowerCase();

const matchesEligibility = (scheme, user) => {
    const eligibility = scheme.eligibility || {};
    const userState = user.state || user.location?.state || "";

    if(Array.isArray(eligibility.occupation) && eligibility.occupation.length > 0) {
        if(!user.occupation || !eligibility.occupation.includes(user.occupation)) {
            return false;
        }
    }

    if(eligibility.state && normalize(eligibility.state) !== normalize(userState)) {
        return false;
    }

    if(eligibility.isPregnantOrNewMother === true && user.isPregnantOrNewMother !== true) {
        return false;
    }

    if(Number.isFinite(eligibility.minAge) && (!Number.isFinite(user.age) || user.age < eligibility.minAge)) {
        return false;
    }

    if(Number.isFinite(eligibility.maxAge) && (!Number.isFinite(user.age) || user.age > eligibility.maxAge)) {
        return false;
    }

    if(Number.isFinite(eligibility.annualIncomeMax) && (!Number.isFinite(user.annualIncome) || user.annualIncome > eligibility.annualIncomeMax)) {
        return false;
    }

    return true;
};

const parseNotes = (content) => {
    try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed.notes) ? parsed.notes : [];
    } catch (error) {
        return [];
    }
};

const fallbackNote = (scheme, profile) => {
    const details = [profile.occupation, profile.state, profile.age ? `${profile.age} years old` : ""].filter(Boolean).join(", ");
    return details ? `This scheme may fit because your profile includes ${details}. Check the official link for final eligibility.` : `This scheme matches the available profile details. Check the official link for final eligibility.`;
};

export const recommendSchemes = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if(!user) {
            return res.status(404).json({
                message: "User profile not found",
                success: false
            });
        }

        const eligibleSchemes = GOV_SCHEMES.filter((scheme) => matchesEligibility(scheme, user));

        if(eligibleSchemes.length === 0) {
            return res.status(200).json({
                message: "Complete your profile with age, occupation, state, income, category, and motherhood details to find matching schemes.",
                success: true,
                schemes: []
            });
        }

        if(!process.env.GROQ_API_KEY) {
            return res.status(503).json({
                message: "GROQ_API_KEY is not configured",
                success: false
            });
        }

        const profile = {
            age: user.age || null,
            occupation: user.occupation || null,
            state: user.state || user.location?.state || null,
            annualIncome: user.annualIncome || null,
            maritalStatus: user.maritalStatus || null,
            isPregnantOrNewMother: user.isPregnantOrNewMother || false,
            category: user.category || null
        };

        let notes = [];

        try {
            const completion = await groq.chat.completions.create({
                model: SAFETY_MODEL,
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: "You personalize government scheme matches. Return strict JSON only with this shape: { \"notes\": [{ \"id\": string, \"note\": string }] }. Write only a 1-2 sentence personalized note per provided scheme explaining why it fits the supplied user profile. Do not invent new schemes, benefit amounts, eligibility rules, application rules, or facts beyond the provided scheme list and user profile."
                    },
                    {
                        role: "user",
                        content: JSON.stringify({
                            profile,
                            eligibleSchemes
                        })
                    }
                ],
                temperature: 0.2,
                max_tokens: 700
            });

            notes = parseNotes(completion.choices[0]?.message?.content || "");
        } catch (error) {
            console.error("Scheme recommendation provider error:", error.status || error.code || error.message);
        }
        const notesById = new Map(notes.map((item) => [item.id, item.note]));

        return res.status(200).json({
            success: true,
            schemes: eligibleSchemes.map((scheme) => ({
                ...scheme,
                personalizedNote: notesById.get(scheme.id) || fallbackNote(scheme, profile)
            }))
        });
    } catch (error) {
        console.error("Scheme recommendation error:", error.status || error.code || error.message);

        return res.status(500).json({
            message: "Could not recommend schemes",
            success: false
        });
    }
};
