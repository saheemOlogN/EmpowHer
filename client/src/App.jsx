import { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import { getDashboard, loginUser, markWorkerSafe } from "./services/api.js";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState("");

  async function loadDashboard(userId) {
    const data = await getDashboard(userId);

    if(!data.success) {
      setMessage(data.message);
      return;
    }

    setDashboard(data);
  }

  async function handleLogin(formData) {
    setMessage("");

    const data = await loginUser(formData);

    if(!data.success) {
      setMessage(data.message);
      return false;
    }

    setCurrentUser(data.user);
    await loadDashboard(data.user._id);
    setMessage(data.message);
    return true;
  }

  async function handleMarkSafe(workerId) {
    const data = await markWorkerSafe(workerId, currentUser._id, 5);

    setMessage(data.message);

    if(data.success) {
      await loadDashboard(currentUser._id);
    }
  }

  function showSafetyPinMessage() {
    setMessage("Safety pin will be implemented soon");
  }

  if(!currentUser || !dashboard) {
    return (
      <Login
        message={message}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <Dashboard
      currentUser={currentUser}
      dashboard={dashboard}
      message={message}
      onMarkSafe={handleMarkSafe}
      onSafetyPin={showSafetyPinMessage}
    />
  );
}

export default App;
