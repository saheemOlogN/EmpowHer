import { Bell, HeartHandshake, MapPin, Star, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import TrustSeal from "../components/TrustSeal.jsx";
import {
  getAlerts,
  getConnections,
  getDashboard,
  getSharedLocations,
  markWorkerSafe,
  sendConnectionRequest
} from "../services/api.js";

function RatingPicker({ onRate }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-picker" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button key={rating} onMouseEnter={() => setHover(rating)} onClick={() => onRate(rating)} aria-label={`Rate ${rating} stars`}>
          <Star size={18} fill={rating <= hover ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

function Dashboard({ currentUser }) {
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [connections, setConnections] = useState({ accepted: [], pendingIncoming: [], pendingOutgoing: [] });
  const [sharedLocations, setSharedLocations] = useState([]);
  const [message, setMessage] = useState("");

  async function load() {
    const [dashboardData, alertData, connectionData, locationData] = await Promise.all([
      getDashboard(),
      getAlerts(currentUser.locality),
      getConnections(),
      getSharedLocations()
    ]);

    if(dashboardData.success) setDashboard(dashboardData);
    if(alertData.success) setAlerts(alertData.alerts);
    if(connectionData.success) setConnections(connectionData);
    if(locationData.success) setSharedLocations(locationData.locations);
  }

  useEffect(() => {
    load();
  }, []);

  const outgoingIds = useMemo(() => new Set(connections.pendingOutgoing.map((connection) => String(connection.recipient._id))), [connections]);
  const connectedIds = useMemo(() => new Set(connections.accepted.flatMap((connection) => [String(connection.requester._id), String(connection.recipient._id)])), [connections]);

  async function requestConnection(recipientId) {
    const data = await sendConnectionRequest(recipientId);
    setMessage(data.message);
    await load();
  }

  async function rateWorker(workerId, rating) {
    const data = await markWorkerSafe(workerId, rating);
    setMessage(data.message);
    await load();
  }

  if(!dashboard) {
    return <section className="page-panel">Loading dashboard...</section>;
  }

  const womenNearby = dashboard.womenNearby || [];
  const workersNearby = dashboard.workersNearby || [];
  const activeAlerts = alerts.filter((alert) => alert.status === "active");
  const mapCenter = sharedLocations[0] ? [sharedLocations[0].latitude, sharedLocations[0].longitude] : [19.076, 72.8777];

  return (
    <div className="page-stack">
      {message && <p className="notice">{message}</p>}

      <section className="alert-strip">
        <p className="data-label">{activeAlerts.length} ACTIVE ALERTS IN {currentUser.locality}</p>
        <div>
          {activeAlerts.slice(0, 3).map((alert) => (
            <span key={alert._id}>{alert.type.replaceAll("_", " ")}</span>
          ))}
          {activeAlerts.length === 0 && <span>No alerts in your area yet</span>}
        </div>
      </section>

      <section className="quick-grid">
        <Link className="action-card" to="/connections"><UsersRound />Connections</Link>
        <Link className="action-card" to="/experiences"><HeartHandshake />Experiences</Link>
        <Link className="action-card" to="/alerts"><Bell />Raise alert</Link>
      </section>

      {sharedLocations.length > 0 ? (
        <section className="page-panel">
          <div className="section-heading">
            <div>
              <p className="data-label">LIVE CONNECTIONS</p>
              <h2>Shared locations</h2>
            </div>
          </div>
          <MapContainer center={mapCenter} zoom={13} className="map-panel">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {sharedLocations.map((person) => (
              <Marker key={person._id} position={[person.latitude, person.longitude]}>
                <Popup>{person.name} in {person.locality}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </section>
      ) : (
        <section className="empty-text">No trusted connection is sharing live location with you yet - you will see them here when sharing starts.</section>
      )}

      <section className="dashboard-columns">
        <div className="page-panel">
          <div className="section-heading">
            <div>
              <p className="data-label">{womenNearby.length} LOCAL PROFILES</p>
              <h2>Women Nearby</h2>
            </div>
          </div>
          <div className="card-list">
            {womenNearby.length === 0 && <p className="empty-text">No women found in your locality yet - nearby profiles will appear here after they join.</p>}
            {womenNearby.map((woman) => {
              const connected = connectedIds.has(String(woman._id));
              const requested = outgoingIds.has(String(woman._id));
              return (
                <article key={woman._id} className="list-card">
                  <div>
                    <h3>{woman.name}</h3>
                    <p><MapPin size={14} /> {woman.locality}</p>
                  </div>
                  {connected ? <TrustSeal label="CONNECTED" /> : (
                    <button className="small-button" disabled={requested} onClick={() => requestConnection(woman._id)}>
                      {requested ? "Requested" : "Connect"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="page-panel">
          <div className="section-heading">
            <div>
              <p className="data-label">{workersNearby.length} LOCAL WORKERS</p>
              <h2>Workers Nearby</h2>
            </div>
          </div>
          <div className="card-list">
            {workersNearby.length === 0 && <p className="empty-text">No workers found in your locality yet - recommended workers will appear here once your community rates them.</p>}
            {workersNearby.map((worker) => (
              <article key={worker._id} className="list-card worker-card">
                {worker.isRecommended && <TrustSeal label="COMMUNITY RECOMMENDED" tone="star" />}
                <div>
                  <h3>{worker.name}</h3>
                  <p>{worker.workType || "Worker"} in {worker.locality}</p>
                  <p className="rating-line"><Star size={15} fill="currentColor" /> {worker.safetyRating || 0} from {worker.ratingCount || 0} marks</p>
                </div>
                {currentUser.role === "woman" && <RatingPicker onRate={(rating) => rateWorker(worker._id, rating)} />}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
