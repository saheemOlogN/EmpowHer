import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Shell from "./components/Shell.jsx";
import Alerts from "./pages/Alerts.jsx";
import Assistant from "./pages/Assistant.jsx";
import Connections from "./pages/Connections.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Experiences from "./pages/Experiences.jsx";
import Login from "./pages/Login.jsx";
import SafetyPin from "./pages/SafetyPin.jsx";
import { clearSession, getDashboard, getStoredUser, getToken, storeSession } from "./services/api.js";

function AppRoutes() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    async function verifyStoredSession() {
      if(!getToken()) {
        setChecking(false);
        return;
      }

      const data = await getDashboard();

      if(data.success) {
        setCurrentUser(data.user);
        localStorage.setItem("empowherUser", JSON.stringify(data.user));
      } else {
        clearSession();
        setCurrentUser(null);
      }

      setChecking(false);
    }

    verifyStoredSession();
  }, []);

  function handleLogin(session) {
    storeSession(session);
    setCurrentUser(session.user);
    navigate("/");
  }

  function handleLogout() {
    clearSession();
    setCurrentUser(null);
  }

  if(checking) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  const protectedShell = currentUser
    ? <Shell currentUser={currentUser} onLogout={handleLogout} />
    : <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
      <Route element={protectedShell}>
        <Route path="/" element={<Dashboard currentUser={currentUser} />} />
        <Route path="/connections" element={<Connections currentUser={currentUser} />} />
        <Route path="/alerts" element={<Alerts currentUser={currentUser} />} />
        <Route path="/experiences" element={<Experiences currentUser={currentUser} />} />
        <Route path="/assistant" element={<Assistant currentUser={currentUser} />} />
        <Route path="/safety-pin" element={<SafetyPin />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
