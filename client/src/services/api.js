const apiUrl = "/api";

export const getToken = () => localStorage.getItem("empowherToken");

export const getStoredUser = () => {
  const raw = localStorage.getItem("empowherUser");
  return raw ? JSON.parse(raw) : null;
};

export const storeSession = ({ token, user }) => {
  localStorage.setItem("empowherToken", token);
  localStorage.setItem("empowherUser", JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("empowherToken");
  localStorage.removeItem("empowherUser");
};

const request = async (path, options = {}) => {
  try {
    const token = getToken();
    const response = await fetch(`${apiUrl}${path}`, {
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
    return {
      message: "Server is not reachable",
      success: false
    };
  }
};

export const sendOtp = (formData) => request("/auth/send-otp", {
  method: "POST",
  body: JSON.stringify(formData)
});

export const verifyOtp = (formData) => request("/auth/verify-otp", {
  method: "POST",
  body: JSON.stringify(formData)
});

export const getDashboard = () => request("/users/me/dashboard");

export const markWorkerSafe = (workerId, rating) => request(`/workers/${workerId}/mark-safe`, {
  method: "POST",
  body: JSON.stringify({ rating })
});

export const getAlerts = (locality) => request(`/alerts${locality ? `?locality=${encodeURIComponent(locality)}` : ""}`);

export const createAlert = (payload) => request("/alerts", {
  method: "POST",
  body: JSON.stringify(payload)
});

export const resolveAlert = (alertId) => request(`/alerts/${alertId}/resolve`, {
  method: "PATCH"
});

export const getExperiences = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/experiences${query ? `?${query}` : ""}`);
};

export const createExperience = (payload) => request("/experiences", {
  method: "POST",
  body: JSON.stringify(payload)
});

export const toggleExperienceLike = (experienceId) => request(`/experiences/${experienceId}/like`, {
  method: "PATCH"
});

export const askAssistant = (payload) => request("/assistant", {
  method: "POST",
  body: JSON.stringify(payload)
});

export const getConnections = () => request("/connections");

export const sendConnectionRequest = (recipientId) => request("/connections", {
  method: "POST",
  body: JSON.stringify({ recipientId })
});

export const acceptConnectionRequest = (connectionId) => request(`/connections/${connectionId}/accept`, {
  method: "PATCH"
});

export const declineConnectionRequest = (connectionId) => request(`/connections/${connectionId}`, {
  method: "DELETE"
});

export const updateLocation = (userId, payload) => request(`/users/${userId}/location`, {
  method: "PATCH",
  body: JSON.stringify(payload)
});

export const shareLocation = (userId, payload) => request(`/users/${userId}/share-location`, {
  method: "POST",
  body: JSON.stringify(payload)
});

export const getSharedLocations = () => request("/users/shared-locations");
