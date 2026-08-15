import {
  Bell,
  Bot,
  HeartHandshake,
  Home,
  LogOut,
  MapPin,
  Radio,
  ShieldCheck,
  UsersRound,
  Wifi
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getConnections, shareLocation, updateLocation } from "../services/api.js";
import { AssistantBubble } from "./AssistantChat.jsx";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/connections", label: "Connections", icon: UsersRound },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/experiences", label: "Experiences", icon: HeartHandshake },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/safety-pin", label: "Safety Pin", icon: Wifi }
];

function Shell({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const watchRef = useRef(null);
  const intervalRef = useRef(null);
  const lastPositionRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");

  async function connectionIds() {
    const data = await getConnections();

    if(!data.success) {
      return [];
    }

    return data.accepted.map((connection) => {
      const requester = String(connection.requester._id);
      return requester === currentUser._id ? connection.recipient._id : connection.requester._id;
    });
  }

  async function patchLastPosition(position) {
    lastPositionRef.current = position;
    await updateLocation(currentUser._id, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }

  async function toggleSharing() {
    if(sharing) {
      if(watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
      window.clearInterval(intervalRef.current);
      await shareLocation(currentUser._id, { shareWithUserIds: [], durationMinutes: 0 });
      setSharing(false);
      setStatus("Live location sharing is off");
      return;
    }

    if(!navigator.geolocation) {
      setStatus("Location is not available in this browser");
      return;
    }

    const ids = await connectionIds();
    await shareLocation(currentUser._id, { shareWithUserIds: ids, durationMinutes: 120 });

    watchRef.current = navigator.geolocation.watchPosition(
      patchLastPosition,
      () => setStatus("Couldn't access location - check browser permission"),
      { enableHighAccuracy: true }
    );
    intervalRef.current = window.setInterval(() => {
      if(lastPositionRef.current) {
        patchLastPosition(lastPositionRef.current);
      }
    }, 20000);

    setSharing(true);
    setStatus(ids.length ? "Live location sharing is on" : "Sharing is on; add connections so they can see it");
  }

  useEffect(() => () => {
    if(watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    window.clearInterval(intervalRef.current);
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <div className="brand-icon"><ShieldCheck size={24} /></div>
          <div>
            <p>EmpowHer</p>
            <span>Community Safety</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "side-link-active" : "side-link"}>
                <Icon size={19} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <button className="logout-button" onClick={() => { onLogout(); navigate("/login"); }}>
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      <section className="shell-content">
        <header className="topbar">
          <div>
            <p className="data-label">SIGNED IN AS {currentUser.role}</p>
            <h1>{currentUser.name}</h1>
            <span className="locality-line"><MapPin size={16} /> {currentUser.locality}</span>
          </div>
          <div className="topbar-actions">
            <button className={`live-switch ${sharing ? "active" : ""}`} onClick={toggleSharing}>
              <span className="switch-track"><span /></span>
              <Radio size={17} />
              Share my live location
            </button>
            {status && <p className="share-status">{status}</p>}
          </div>
        </header>

        <Outlet />
      </section>

      <AssistantBubble currentUser={currentUser} />
    </main>
  );
}

export default Shell;
