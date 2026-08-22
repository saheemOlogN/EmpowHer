import groq, { SAFETY_MODEL } from "../config/groq.js";
import Report from "../models/Report.model.js";

const getTimeOfDayRisk = (date = new Date()) => {
    const hour = date.getHours();

    if(hour >= 22 || hour < 5) {
        return 0.9;
    }

    if(hour >= 19 && hour < 22) {
        return 0.6;
    }

    if(hour >= 5 && hour < 8) {
        return 0.4;
    }

    return 0.15;
};

const fetchAreaSignals = async (lat, lng) => {
    if(!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }

    const query = `
        [out:json][timeout:8];
        (
          node(around:400,${lat},${lng})["highway"="street_lamp"];
          node(around:400,${lat},${lng})["amenity"];
          node(around:400,${lat},${lng})["shop"];
          node(around:400,${lat},${lng})["public_transport"];
        );
        out tags;
    `;

    try {
        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ data: query })
        });

        if(!response.ok) {
            return null;
        }

        const data = await response.json();
        const elements = Array.isArray(data.elements) ? data.elements : [];

        return {
            radiusMeters: 400,
            streetLampCount: elements.filter((item) => item.tags?.highway === "street_lamp").length,
            poiCount: elements.filter((item) => item.tags?.amenity || item.tags?.shop || item.tags?.public_transport).length
        };
    } catch (error) {
        return null;
    }
};

const parseGroqJson = (content) => {
    try {
        return JSON.parse(content);
    } catch (error) {
        return null;
    }
};

const buildFallbackAnalysis = (computedData) => {
    const averageSeverity = computedData.reportSummary.length
        ? computedData.reportSummary.reduce((sum, item) => sum + item.averageSeverity, 0) / computedData.reportSummary.length
        : 0;
    const crimeScore = Math.min(100, Math.round((computedData.totalReports * 12) + (averageSeverity * 10)));
    const timeScore = Math.round(computedData.timeOfDayRisk * 100);
    const lightingScore = computedData.osmSignals
        ? Math.max(0, 100 - Math.min(100, computedData.osmSignals.streetLampCount * 12))
        : 50;
    const crowdScore = computedData.osmSignals
        ? Math.max(0, 100 - Math.min(100, computedData.osmSignals.poiCount * 4))
        : 50;
    const overallScore = Math.round((crimeScore * 0.4) + (timeScore * 0.25) + (lightingScore * 0.2) + (crowdScore * 0.15));
    const riskLevel = overallScore >= 67 ? "high" : overallScore >= 34 ? "moderate" : "low";

    return {
        overallScore,
        riskLevel,
        factors: {
            crimeHistory: {
                score: crimeScore,
                note: `${computedData.totalReports} community reports found in the last ${computedData.lookbackDays} days.`
            },
            timeOfDay: {
                score: timeScore,
                note: `Current time risk factor is ${computedData.timeOfDayRisk}.`
            },
            lighting: {
                score: lightingScore,
                note: computedData.osmSignals ? `${computedData.osmSignals.streetLampCount} mapped street lamps found within ${computedData.osmSignals.radiusMeters}m.` : "Lighting signal is unavailable."
            },
            crowdDensity: {
                score: crowdScore,
                note: computedData.osmSignals ? `${computedData.osmSignals.poiCount} mapped POIs found within ${computedData.osmSignals.radiusMeters}m.` : "Crowd density signal is unavailable."
            }
        },
        summary: `${computedData.locality} is currently assessed as ${riskLevel} risk from available computed signals.`,
        recommendation: riskLevel === "high" ? "Avoid travelling alone, share live location, and prefer well-lit public routes." : "Stay aware, use familiar public routes, and keep trusted contacts updated."
    };
};

export const analyzeArea = async (req, res) => {
    try {
        const { locality, lat, lng } = req.body;

        if(!locality) {
            return res.status(400).json({
                message: "Locality is required",
                success: false
            });
        }

        if(!process.env.GROQ_API_KEY) {
            return res.status(503).json({
                message: "GROQ_API_KEY is not configured",
                success: false
            });
        }

        const numericLat = Number(lat);
        const numericLng = Number(lng);
        const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const timeOfDayRisk = getTimeOfDayRisk();

        const [reportSummary, osmSignals] = await Promise.all([
            Report.aggregate([
                {
                    $match: {
                        locality,
                        createdAt: { $gte: since }
                    }
                },
                {
                    $group: {
                        _id: "$type",
                        count: { $sum: 1 },
                        averageSeverity: { $avg: "$severity" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        type: "$_id",
                        count: 1,
                        averageSeverity: { $round: ["$averageSeverity", 2] }
                    }
                }
            ]),
            fetchAreaSignals(numericLat, numericLng)
        ]);

        const computedData = {
            locality,
            coordinates: {
                lat: Number.isFinite(numericLat) ? numericLat : null,
                lng: Number.isFinite(numericLng) ? numericLng : null
            },
            lookbackDays: 90,
            reportSummary,
            totalReports: reportSummary.reduce((sum, item) => sum + item.count, 0),
            timeOfDayRisk,
            osmSignals
        };

        let analysis = null;

        try {
            const completion = await groq.chat.completions.create({
                model: SAFETY_MODEL,
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: "You analyze women's community safety using only provided computed signals. Return strict JSON only with this shape: { \"overallScore\": number, \"riskLevel\": \"low\" | \"moderate\" | \"high\", \"factors\": { \"crimeHistory\": { \"score\": number, \"note\": string }, \"timeOfDay\": { \"score\": number, \"note\": string }, \"lighting\": { \"score\": number, \"note\": string }, \"crowdDensity\": { \"score\": number, \"note\": string } }, \"summary\": string, \"recommendation\": string }. Scores must be 0-100. Do not invent data beyond what is provided. If a signal is unavailable or null, say so in the relevant note."
                    },
                    {
                        role: "user",
                        content: JSON.stringify(computedData)
                    }
                ],
                temperature: 0.1,
                max_tokens: 700
            });

            analysis = parseGroqJson(completion.choices[0]?.message?.content || "");
        } catch (error) {
            console.error("Safety analysis provider error:", error.status || error.code || error.message);
            analysis = buildFallbackAnalysis(computedData);
        }

        if(!analysis) {
            analysis = buildFallbackAnalysis(computedData);
        }

        return res.status(200).json({
            success: true,
            locality,
            analyzedAt: new Date().toISOString(),
            ...analysis
        });
    } catch (error) {
        console.error("Safety analysis error:", error.status || error.code || error.message);

        return res.status(500).json({
            message: "Could not analyze area safety",
            success: false
        });
    }
};
