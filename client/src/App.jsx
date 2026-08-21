import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Shell from "./components/Shell.jsx";
import Alerts from "./pages/Alerts.jsx";
import Assistant from "./pages/Assistant.jsx";
import Connections from "./pages/Connections.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Experiences from "./pages/Experiences.jsx";
import Opportunities from "./pages/Opportunities.jsx";
import SafetyPin from "./pages/SafetyPin.jsx";
import Signin from "./pages/Signin.jsx";
import Signup from "./pages/Signup.jsx";
import { clearSession, getDashboard, getStoredUser, getToken, storeSession } from "./services/api.js";
import { Toaster } from "sonner";

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
    navigate("/", { replace: true });
  }

  function handleUserUpdate(user) {
    setCurrentUser(user);
    localStorage.setItem("empowherUser", JSON.stringify(user));
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
    <>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Signin onLogin={handleLogin} />} />
        <Route path="/signup" element={currentUser ? <Navigate to="/" replace /> : <Signup onLogin={handleLogin} />} />
        <Route element={protectedShell}>
          <Route path="/" element={<Dashboard currentUser={currentUser} onUserUpdate={handleUserUpdate} />} />
          <Route path="/connections" element={<Connections currentUser={currentUser} />} />
          <Route path="/opportunities" element={<Opportunities currentUser={currentUser} />} />
          <Route path="/alerts" element={<Alerts currentUser={currentUser} />} />
          <Route path="/experiences" element={<Experiences currentUser={currentUser} />} />
          <Route path="/assistant" element={<Assistant currentUser={currentUser} />} />
          <Route path="/safety-pin" element={<SafetyPin />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </>
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
