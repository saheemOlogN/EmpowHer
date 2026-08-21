import {
  Bell,
  Bot,
  HeartHandshake,
  Home,
  ListChecks,
  LogOut,
  MapPin,
  Radio,
  Star,
  UsersRound,
  Wifi
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getAlerts,
  getConnections,
  getExperiences,
  getOpportunities,
  getSharedLocations,
  shareLocation,
  updateLocation
} from "../services/api.js";
import { AssistantBubble } from "./AssistantChat.jsx";
import logoUrl from "../assets/empowher-logo.png";

const generalNavItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/connections", label: "Connections", icon: UsersRound },
  { to: "/opportunities", label: "Opportunities", icon: ListChecks },
  { to: "/experiences", label: "Experiences", icon: HeartHandshake },
  { to: "/assistant", label: "Assistant", icon: Bot }
];

const safetyNavItems = [
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/safety-pin", label: "Safety Pin", icon: Wifi }
];

const workerNavItems = [
  { to: "/requests", label: "Requests", icon: ListChecks },
  { to: "/my-ratings", label: "My Ratings", icon: Star }
];

function getWelcome(user) {
  return `Hello, ${user.name}`;
}

function formatAlertType(type) {
  return type.replaceAll("_", " ");
}

function buildNotifications({ alerts = [], experiences = [], opportunities = [], connections = [], locations = [] }) {
  return [
    ...alerts.slice(0, 4).map((alert) => ({
      id: `alert-${alert._id}-${alert.status}`,
      tone: alert.status === "active" ? "danger" : "neutral",
      title: `${formatAlertType(alert.type)} alert`,
      detail: alert.description,
      time: alert.createdAt
    })),
    ...locations.slice(0, 3).map((person) => ({
      id: `location-${person._id}-${person.sharingExpiresAt}`,
      tone: "success",
      title: `${person.name} is sharing live location`,
      detail: person.locality,
      time: person.sharingExpiresAt
    })),
    ...connections.slice(0, 3).map((connection) => ({
      id: `connection-${connection._id}`,
      tone: "brand",
      title: "Connection request",
      detail: `${connection.requester.name} wants to connect`,
      time: connection.createdAt
    })),
    ...opportunities.slice(0, 3).map((item) => ({
      id: `opportunity-${item._id}`,
      tone: "warning",
      title: "New opportunity",
      detail: item.title,
      time: item.createdAt
    })),
    ...experiences.slice(0, 3).map((item) => ({
      id: `experience-${item._id}`,
      tone: "neutral",
      title: "Community update",
      detail: item.title,
      time: item.createdAt
    }))
  ]
    .filter((item) => item.id)
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
    .slice(0, 8);
}

function Shell({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const watchRef = useRef(null);
  const intervalRef = useRef(null);
  const lastPositionRef = useRef(null);
  const notificationSignatureRef = useRef("");
  const notificationReadyRef = useRef(false);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  useEffect(() => {
    if(currentUser.role === "worker") {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    let cancelled = false;

    async function pollNotifications() {
      const [alertData, experienceData, opportunityData, connectionData, locationData] = await Promise.all([
        getAlerts(currentUser.locality),
        getExperiences({ locality: currentUser.locality }),
        getOpportunities({ locality: currentUser.locality }),
        getConnections(),
        getSharedLocations()
      ]);

      if(cancelled) return;

      const nextNotifications = buildNotifications({
        alerts: alertData.success ? alertData.alerts : [],
        experiences: experienceData.success ? experienceData.experiences : [],
        opportunities: opportunityData.success ? opportunityData.opportunities : [],
        connections: connectionData.success ? connectionData.pendingIncoming : [],
        locations: locationData.success ? locationData.locations : []
      });
      const nextSignature = nextNotifications.map((item) => item.id).join("|");
      const previousSignature = notificationSignatureRef.current;

      setNotifications(nextNotifications);

      if(notificationReadyRef.current && nextSignature && nextSignature !== previousSignature) {
        const newest = nextNotifications.find((item) => !previousSignature.includes(item.id));
        setUnreadCount((count) => count + 1);
        window.dispatchEvent(new CustomEvent("empowher:live-update", { detail: { source: "notifications" } }));
        if(newest) {
          toast(newest.title, { description: newest.detail });
        }
      }

      notificationSignatureRef.current = nextSignature;
      notificationReadyRef.current = true;
    }

    pollNotifications();
    const pollId = window.setInterval(pollNotifications, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, [currentUser.locality, currentUser.role]);

  function toggleNotifications() {
    setNotificationsOpen((open) => !open);
    setUnreadCount(0);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <img className="brand-logo" src={logoUrl} alt="EmpowHer" />
          <div>
            <p>EmpowHer</p>
            <span>Changing Locality to a Community</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {(currentUser.role === "worker" ? workerNavItems : generalNavItems).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "side-link-active" : "side-link"}>
                <Icon size={24} />
                {item.label}
              </NavLink>
            );
          })}

          {currentUser.role === "woman" && (
            <div className="nav-section">
              <span>Safety</span>
              {safetyNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "side-link-active safety-link" : "side-link safety-link"}>
                    <Icon size={24} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        <button className="logout-button" onClick={() => { onLogout(); navigate("/login"); }}>
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      <section className="shell-content">
        <header className="status-header">
          <div className="status-copy">
            <h1>{getWelcome(currentUser)}</h1>
            <span className="locality-pill"><MapPin size={16} /> {currentUser.location?.area || currentUser.locality || "Locality pending"}</span>
          </div>
          <div className="topbar-actions">
            <div className="status-actions-row">
              {currentUser.role === "woman" && (
                <div className="notification-wrap">
                  <button className="notification-button" onClick={toggleNotifications} aria-label="Open notifications">
                    <Bell size={19} />
                    {unreadCount > 0 && <span>{unreadCount}</span>}
                  </button>
                  {notificationsOpen && (
                    <div className="notification-menu">
                      <div className="notification-menu-head">
                        <strong>Updates</strong>
                        <small>{notifications.length ? `${notifications.length} recent` : "All quiet"}</small>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="notification-empty">No new alerts or community events yet.</p>
                      ) : (
                        notifications.map((item) => (
                          <article key={item.id} className={`notification-item ${item.tone}`}>
                            <strong>{item.title}</strong>
                            <p>{item.detail}</p>
                          </article>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentUser.role === "woman" && (
                <button className={`live-switch ${sharing ? "active" : ""}`} onClick={toggleSharing}>
                  <span className="switch-track"><span /></span>
                  <Radio size={17} />
                  Share my live location
                </button>
              )}
            </div>
            {status && <p className="share-status">{status}</p>}
          </div>
        </header>

        <Outlet />
      </section>

      {currentUser.role === "woman" && <AssistantBubble currentUser={currentUser} />}
    </main>
  );
}

export default Shell;
