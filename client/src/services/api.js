const apiUrl = "/api";

export const loginUser = async (formData) => {
  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    return await response.json();
  } catch (error) {
    return {
      message: "Server is not reachable",
      success: false
    };
  }
};

export const getDashboard = async (userId) => {
  try {
    const response = await fetch(`${apiUrl}/users/${userId}/dashboard`);
    return await response.json();
  } catch (error) {
    return {
      message: "Dashboard data failed",
      success: false
    };
  }
};

export const markWorkerSafe = async (workerId, userId, rating) => {
  try {
    const response = await fetch(`${apiUrl}/workers/${workerId}/mark-safe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        rating
      })
    });

    return await response.json();
  } catch (error) {
    return {
      message: "Could not update worker rating",
      success: false
    };
  }
};
