import { clearSession, getToken } from "./api.js";

const apiUrl = import.meta.env.VITE_API_URL || "/api";
const fallbackApiUrl = `http://127.0.0.1:${import.meta.env.VITE_API_PORT || "4000"}/api`;

const request = async (path, options = {}, baseUrl = apiUrl) => {
    try {
        const token = getToken();
        const response = await fetch(`${baseUrl}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {})
            }
        });
        const data = await response.json();

        if(response.status === 401) {
            clearSession();
        }

        return data;
    } catch (error) {
        if(baseUrl !== fallbackApiUrl) {
            return request(path, options, fallbackApiUrl);
        }

        return {
            message: `Server is not reachable. Make sure the API is running on port ${import.meta.env.VITE_API_PORT || "4000"}.`,
            success: false
        };
    }
};

export const analyzeArea = (locality, lat, lng) => request("/safety/analyze", {
    method: "POST",
    body: JSON.stringify({ locality, lat, lng })
});
