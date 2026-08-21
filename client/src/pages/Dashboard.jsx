import { Bell, BriefcaseBusiness, HeartHandshake, ListChecks, MapPin, Search, Star, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import TrustSeal from "../components/TrustSeal.jsx";
import {
  getAlerts,
  getConnections,
  getDashboard,
  getLocalitySummary,
  getSharedLocations,
  markWorkerSafe,
  searchPeople,
  sendConnectionRequest,
  updateLocality
} from "../services/api.js";
import { getLocationSuggestions, getSelectedLocation } from "../services/location.js";

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

function Dashboard({ currentUser, onUserUpdate }) {
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [connections, setConnections] = useState({ accepted: [], pendingIncoming: [], pendingOutgoing: [] });
  const [sharedLocations, setSharedLocations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [peopleResults, setPeopleResults] = useState([]);
  const [localityDraft, setLocalityDraft] = useState(currentUser.locality);
  const [localityCoords, setLocalityCoords] = useState({ latitude: currentUser.latitude || null, longitude: currentUser.longitude || null });
  const [localitySuggestions, setLocalitySuggestions] = useState([]);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const localitySearchRef = useRef(null);

  async function load() {
    setLoading(true);
    const [dashboardData, alertData, connectionData, locationData, summaryData] = await Promise.all([
      getDashboard(),
      getAlerts(currentUser.locality),
      getConnections(),
      getSharedLocations(),
      getLocalitySummary(currentUser.locality)
    ]);

    if(dashboardData.success) {
      setDashboard(dashboardData);
    } else {
      setDashboard({
        user: currentUser,
        womenNearby: [],
        workersNearby: []
      });
      setMessage(dashboardData.message || "Could not load dashboard data");
    }

    if(alertData.success) setAlerts(alertData.alerts);
    if(connectionData.success) setConnections(connectionData);
    if(locationData.success) setSharedLocations(locationData.locations);
    if(summaryData.success) setSummary(summaryData.summary);
    setLoading(false);
  }

  useEffect(() => {
    setLocalityDraft(currentUser.locality);
    setLocalityCoords({ latitude: currentUser.latitude || null, longitude: currentUser.longitude || null });
    load();
  }, [currentUser._id, currentUser.locality]);

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

  async function handleLocalityInput(value) {
    setLocalityDraft(value);

    if(localitySearchRef.current) {
      window.clearTimeout(localitySearchRef.current);
    }

    if(!value || value.length < 3) {
      setLocalitySuggestions([]);
      return;
    }

    localitySearchRef.current = window.setTimeout(async () => {
      const nextSuggestions = await getLocationSuggestions(value, localityCoords);

      setLocalitySuggestions(nextSuggestions);
    }, 300);
  }

  async function chooseLocality(suggestion) {
    const data = await getSelectedLocation(suggestion);

    if(!data.success) {
      setMessage(data.message);
      return;
    }

    setLocalityDraft(data.locality);
    setLocalityCoords({ latitude: data.latitude, longitude: data.longitude });
    if(localitySearchRef.current) {
      window.clearTimeout(localitySearchRef.current);
    }
    setLocalitySuggestions([]);

    const summaryData = await getLocalitySummary(data.locality);
    if(summaryData.success) setSummary(summaryData.summary);
  }

  async function saveLocality() {
    const data = await updateLocality(currentUser._id, {
      locality: localityDraft,
      latitude: localityCoords.latitude,
      longitude: localityCoords.longitude
    });
    setMessage(data.message);

    if(data.success) {
      onUserUpdate(data.user);
    }
  }

  async function runPeopleSearch(value) {
    setPeopleSearch(value);

    if(currentUser.role !== "woman") {
      return;
    }

    const data = await searchPeople({ locality: localityDraft || currentUser.locality, search: value });
    if(data.success) setPeopleResults(data.people);
  }

  if(loading && !dashboard) {
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
        <Link className="action-card" to="/opportunities"><ListChecks />Opportunities</Link>
        <Link className="action-card" to="/experiences"><HeartHandshake />Experiences</Link>
        <Link className="action-card" to="/alerts"><Bell />Raise alert</Link>
      </section>

      <section className="page-panel locality-panel">
        <div className="section-heading">
          <div>
            <p className="data-label">CHANGE OR SCOUT LOCALITY</p>
            <h2>Locality summary</h2>
          </div>
          <button className="small-button" onClick={saveLocality}>Change locality</button>
        </div>
        <div className="locality-tools">
          <div className="relative">
            <input className="field-input" value={localityDraft} onChange={(event) => handleLocalityInput(event.target.value)} placeholder="Search or enter locality" />
            {localitySuggestions.length > 0 && (
              <div className="suggestions">
                {localitySuggestions.map((suggestion) => (
                  <button type="button" key={suggestion.id} onClick={() => chooseLocality(suggestion)}>
                    {suggestion.name}
                    {suggestion.placeFormatted && <span>{suggestion.placeFormatted}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {currentUser.role === "woman" ? (
            <div className="search-row">
              <Search size={17} />
              <input value={peopleSearch} onChange={(event) => runPeopleSearch(event.target.value)} placeholder="Search teacher, housewife, student" />
            </div>
          ) : (
            <p className="privacy-note">Worker accounts can view public locality stats and opportunities, but cannot search or connect with women.</p>
          )}
        </div>
        {summary && (
          <div className="summary-grid">
            <div><strong>{summary.womenCount}</strong><span>women profiles</span></div>
            <div><strong>{summary.workerCount}</strong><span>workers</span></div>
            <div><strong>{summary.activeAlerts}</strong><span>active alerts</span></div>
            <div><strong>{summary.openOpportunities.length}</strong><span>open tasks</span></div>
          </div>
        )}
        {summary?.professions?.length > 0 && (
          <div className="tag-row">
            {summary.professions.map((item) => <span key={item.title}>{item.title} · {item.count}</span>)}
          </div>
        )}
        {currentUser.role === "woman" && peopleResults.length > 0 && (
          <div className="card-list search-results">
            {peopleResults.map((person) => (
              <article key={person._id} className="list-card">
                <div>
                  <h3>{person.name}</h3>
                  <p><BriefcaseBusiness size={14} /> {person.profession || "Community member"} · {person.maritalStatus?.replaceAll("_", " ") || "status not shared"}</p>
                </div>
                <button className="small-button" onClick={() => requestConnection(person._id)}>Connect</button>
              </article>
            ))}
          </div>
        )}
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
                    <p><MapPin size={14} /> {woman.locality} · {woman.profession || "Community member"}</p>
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
