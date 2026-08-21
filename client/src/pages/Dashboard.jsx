import { AlertTriangle, Bell, BriefcaseBusiness, CalendarClock, CheckCircle2, HeartHandshake, ListChecks, MapPin, Search, Star, UserRoundCheck, UsersRound, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import {
  completeBooking,
  createBooking,
  getAlerts,
  getConnections,
  getDashboard,
  getLocalitySummary,
  getMyBookings,
  getSharedLocations,
  markWorkerSafe,
  searchPeople,
  sendConnectionRequest,
  updateBookingStatus,
  updateBookingTracking,
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

function BadgePill({ children, variant = "neutral" }) {
  return <span className={`badge-pill ${variant}`}>{children}</span>;
}

function StarRating({ value = 0, count = 0 }) {
  const rounded = Math.round(Number(value || 0) * 2) / 2;

  return (
    <div className="rating-display" aria-label={`${rounded} out of 5 stars from ${count || 0} marks`}>
      <span className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = rounded >= star ? "full" : rounded >= star - 0.5 ? "half" : "empty";
          return <Star key={star} size={16} className={`star-${fill}`} fill="currentColor" />;
        })}
      </span>
      <span>{rounded || 0} ({count || 0})</span>
    </div>
  );
}

function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="empty-state">
      <Icon size={20} />
      <span>{message}</span>
      {action}
    </div>
  );
}

const categoryFilters = ["Teacher", "Housewife", "Student", "Nurse", "Tailor"];
const bookingDefaults = {
  taskType: "",
  scheduledFor: "",
  timeWindow: "",
  problem: "",
  quotation: "",
  area: "",
  exactAddress: "",
  notes: ""
};

function Dashboard({ currentUser, onUserUpdate }) {
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [connections, setConnections] = useState({ accepted: [], pendingIncoming: [], pendingOutgoing: [] });
  const [bookings, setBookings] = useState([]);
  const [sharedLocations, setSharedLocations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [previewSummary, setPreviewSummary] = useState(null);
  const [peopleResults, setPeopleResults] = useState([]);
  const [localityDraft, setLocalityDraft] = useState(currentUser.locality);
  const [locationDraft, setLocationDraft] = useState(currentUser.location || { pincode: "", area: "", district: "", state: "" });
  const [pincodeDraft, setPincodeDraft] = useState(currentUser.location?.pincode || "");
  const [localitySuggestions, setLocalitySuggestions] = useState([]);
  const [localityLoading, setLocalityLoading] = useState(false);
  const [localityDialogOpen, setLocalityDialogOpen] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [bookingWorker, setBookingWorker] = useState(null);
  const [bookingForm, setBookingForm] = useState(bookingDefaults);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [dashboardData, alertData, connectionData, bookingData, locationData, summaryData] = await Promise.all([
      getDashboard(),
      getAlerts(currentUser.locality),
      getConnections(),
      getMyBookings(),
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
    if(bookingData.success) setBookings(bookingData.bookings);
    if(locationData.success) setSharedLocations(locationData.locations);
    if(summaryData.success) setSummary(summaryData.summary);
    setLoading(false);
  }

  useEffect(() => {
    setLocalityDraft(currentUser.locality);
    setLocationDraft(currentUser.location || { pincode: "", area: "", district: "", state: "" });
    setPincodeDraft(currentUser.location?.pincode || "");
    setPreviewSummary(null);
    load();
    const refreshId = window.setInterval(load, 8000);
    const handleLiveUpdate = () => load();

    window.addEventListener("empowher:live-update", handleLiveUpdate);

    return () => {
      window.clearInterval(refreshId);
      window.removeEventListener("empowher:live-update", handleLiveUpdate);
    };
  }, [currentUser._id, currentUser.locality, currentUser.location?.pincode]);

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

  function openBooking(worker) {
    setBookingWorker(worker);
    setBookingForm({
      ...bookingDefaults,
      taskType: worker.workType || "",
      area: currentUser.location?.area || currentUser.locality || ""
    });
  }

  async function submitBooking(event) {
    event.preventDefault();
    const data = await createBooking({
      ...bookingForm,
      workerId: bookingWorker._id
    });
    setMessage(data.message);

    if(data.success) {
      setBookingWorker(null);
      setBookingForm(bookingDefaults);
      await load();
    }
  }

  async function respondToBooking(bookingId, status) {
    const data = await updateBookingStatus(bookingId, status);
    setMessage(data.message);
    await load();
  }

  async function markBookingComplete(bookingId) {
    const data = await completeBooking(bookingId);
    setMessage(data.message);
    await load();
  }

  async function refreshBookingTracking() {
    const data = await getMyBookings();
    if(data.success) setBookings(data.bookings);
  }

  function handlePincodeInput(value) {
    const nextPincode = value.replace(/\D/g, "").slice(0, 6);

    setPincodeDraft(nextPincode);
    setLocalityDraft("");
    setPreviewSummary(null);
    setLocationDraft({
      pincode: nextPincode,
      area: "",
      district: "",
      state: ""
    });
    setLocalitySuggestions([]);
  }

  async function fetchLocalities() {
    if(pincodeDraft.length !== 6) {
      setMessage("Enter a valid 6 digit PIN code");
      return;
    }

    setLocalityLoading(true);
    const data = await getLocationSuggestions(pincodeDraft);
    setLocalityLoading(false);

    if(!data.success) {
      setLocalitySuggestions([]);
      setMessage(data.message);
      return;
    }

    setMessage(data.message);
    setLocalitySuggestions(data.suggestions);
  }

  async function chooseLocality(suggestion) {
    const data = await getSelectedLocation(suggestion);

    if(!data.success) {
      setMessage(data.message);
      return;
    }

    setLocalityDraft(data.locality);
    setLocationDraft(data.location);
    setLocalitySuggestions([]);

    const summaryData = await getLocalitySummary(data.locality);
    if(summaryData.success) setPreviewSummary(summaryData.summary);
  }

  function openLocalityDialog() {
    setLocalityDraft(currentUser.locality);
    setLocationDraft(currentUser.location || { pincode: "", area: "", district: "", state: "" });
    setPincodeDraft(currentUser.location?.pincode || "");
    setLocalitySuggestions([]);
    setPreviewSummary(null);
    setLocalityDialogOpen(true);
  }

  function closeLocalityDialog() {
    setLocalityDraft(currentUser.locality);
    setLocationDraft(currentUser.location || { pincode: "", area: "", district: "", state: "" });
    setPincodeDraft(currentUser.location?.pincode || "");
    setLocalitySuggestions([]);
    setPreviewSummary(null);
    setLocalityDialogOpen(false);
  }

  async function saveLocality() {
    const data = await updateLocality(currentUser._id, {
      locality: localityDraft,
      location: locationDraft,
      latitude: null,
      longitude: null
    });
    setMessage(data.message);

    if(data.success) {
      if(previewSummary) setSummary(previewSummary);
      onUserUpdate(data.user);
      setLocalityDialogOpen(false);
    }
  }

  async function runPeopleSearch(value) {
    setPeopleSearch(value);

    if(currentUser.role !== "woman") {
      return;
    }

    const data = await searchPeople({ locality: currentUser.locality, search: value });
    if(data.success) setPeopleResults(data.people);
  }

  if(loading && !dashboard) {
    return <section className="page-panel">Loading dashboard...</section>;
  }

  const womenNearby = dashboard.womenNearby || [];
  const workersNearby = dashboard.workersNearby || [];
  const workerQueue = bookings.filter((booking) => booking.status === "pending");
  const acceptedWorkerBookings = bookings.filter((booking) => booking.status === "accepted");
  const womanBookings = bookings.filter((booking) => ["pending", "accepted", "rejected", "active", "completed"].includes(booking.status));
  const activeAlerts = alerts.filter((alert) => alert.status === "active");
  const mapCenter = sharedLocations[0] ? [sharedLocations[0].latitude, sharedLocations[0].longitude] : [19.076, 72.8777];

  return (
    <div className="page-stack">
      {message && <p className="notice">{message}</p>}

      <section className="dashboard-priority">
        <article className={`alert-anchor ${activeAlerts.length ? "has-alerts" : ""}`}>
          <div className="anchor-icon"><AlertTriangle size={24} /></div>
          <div>
            <BadgePill variant={activeAlerts.length ? "danger" : "success"}>{activeAlerts.length ? "Active safety alerts" : "Area calm"}</BadgePill>
            <h2>{activeAlerts.length ? `${activeAlerts.length} alert${activeAlerts.length === 1 ? "" : "s"} in ${currentUser.locality}` : `No active alerts in ${currentUser.locality}`}</h2>
            <p>{activeAlerts.length ? "Review nearby incidents and check in with trusted connections before heading out." : "Your locality has no active safety alerts right now."}</p>
          </div>
          <div className="alert-chip-row">
            {activeAlerts.slice(0, 3).map((alert) => (
              <BadgePill key={alert._id} variant="danger">{alert.type.replaceAll("_", " ")}</BadgePill>
            ))}
            {activeAlerts.length === 0 && <BadgePill variant="success">No alerts nearby</BadgePill>}
          </div>
          <Link className="primary-button inline" to="/alerts"><Bell size={16} /> Raise alert</Link>
        </article>

        <div className="quick-stack">
          <Link className="action-card" to="/connections"><UsersRound size={20} /><span><strong>Connections</strong><small>People you trust</small></span></Link>
          <Link className="action-card" to="/opportunities"><ListChecks size={20} /><span><strong>Opportunities</strong><small>Local paid tasks</small></span></Link>
          <Link className="action-card" to="/experiences"><HeartHandshake size={20} /><span><strong>Experiences</strong><small>Share and support</small></span></Link>
        </div>
      </section>

      <section className="page-panel locality-info-panel">
        <div className="section-heading">
          <div>
            <h2>Locality summary</h2>
          </div>
          <button className="primary-button inline" onClick={openLocalityDialog}>Change locality</button>
        </div>
        <div className="locality-identity">
          <div>
            <span className="locality-badge"><MapPin size={15} /> {currentUser.location?.area || currentUser.locality || "Locality not set"}</span>
            <h3>{currentUser.locality || "Confirm your locality"}</h3>
            {(currentUser.location?.district || currentUser.location?.state || currentUser.location?.pincode) && (
              <p>{[currentUser.location?.district, currentUser.location?.state, currentUser.location?.pincode ? `PIN ${currentUser.location.pincode}` : ""].filter(Boolean).join(" · ")}</p>
            )}
          </div>
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
      </section>

      {currentUser.role === "woman" && (
        <section className="page-panel locality-search-panel">
          <div className="section-heading">
            <div>
              <h2>Find women in this locality</h2>
            </div>
          </div>
          <div className="community-tools">
            <div className="search-row">
              <Search size={17} />
              <input value={peopleSearch} onChange={(event) => runPeopleSearch(event.target.value)} placeholder="Search by profession or role" />
            </div>
            <div className="filter-chips">
              {categoryFilters.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={peopleSearch === category ? "filter-chip active" : "filter-chip"}
                  onClick={() => runPeopleSearch(peopleSearch === category ? "" : category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          {peopleResults.length > 0 ? (
            <div className="profile-grid search-results">
              {peopleResults.map((person) => (
                <article key={person._id} className="profile-card woman-card">
                  <div className="anonymous-avatar woman-avatar"><UserRoundCheck size={20} /></div>
                  <div>
                    <h3>{person.name}</h3>
                    <p><BriefcaseBusiness size={16} /> {person.profession || "Community member"}</p>
                    <BadgePill variant="neutral">{person.maritalStatus?.replaceAll("_", " ") || "status not shared"}</BadgePill>
                  </div>
                  <button className="small-button" onClick={() => requestConnection(person._id)}>Connect</button>
                </article>
              ))}
            </div>
          ) : (
            peopleSearch && <EmptyState icon={Search} message="No matching women found in this locality yet." />
          )}
        </section>
      )}

      {currentUser.role !== "woman" && (
        <section className="page-panel">
          <p className="privacy-note">Worker accounts can view public locality stats and opportunities, but cannot search or connect with women.</p>
        </section>
      )}

      {currentUser.role === "worker" && (
        <section className="page-panel">
          <div className="section-heading">
            <div>
              <h2>Request Queue</h2>
              <p className="section-caption">{workerQueue.length} pending booking requests</p>
            </div>
          </div>
          <div className="feed-list">
            {workerQueue.length === 0 && <EmptyState icon={CalendarClock} message="No pending booking requests right now." />}
            {workerQueue.map((booking) => (
              <article key={booking._id} className="feed-card opportunity-card">
                <div className="feed-card-top">
                  <span className="category-tag">{booking.taskType}</span>
                  <span className="data-label">{new Date(booking.scheduledFor).toLocaleString()}</span>
                </div>
                <h3>{booking.timeWindow}</h3>
                <p>{booking.notes || "No extra notes shared."}</p>
                <div className="feed-card-bottom">
                  <span>{booking.area}</span>
                  <div className="button-row">
                    <button className="primary-button inline" onClick={() => respondToBooking(booking._id, "accepted")}><CheckCircle2 size={16} /> Accept</button>
                    <button className="secondary-button small" onClick={() => respondToBooking(booking._id, "rejected")}><XCircle size={16} /> Reject</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {acceptedWorkerBookings.length > 0 && (
            <div className="feed-list">
              {acceptedWorkerBookings.map((booking) => (
                <article key={booking._id} className="feed-card opportunity-card">
                  <div className="feed-card-top">
                    <span className="category-tag">Accepted</span>
                    <span className="data-label">{new Date(booking.scheduledFor).toLocaleString()}</span>
                  </div>
                  <h3>{booking.taskType}</h3>
                  <p>{booking.exactAddress ? `Address unlocked: ${booking.exactAddress}` : "Exact address unlocks at the confirmed time."}</p>
                  <div className="feed-card-bottom">
                    <span>{booking.area} · in-app contact only</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {currentUser.role === "woman" && womanBookings.length > 0 && (
        <section className="page-panel">
          <div className="section-heading">
            <div>
              <h2>Your Bookings</h2>
              <p className="section-caption">Worker contact stays inside EmpowHer.</p>
            </div>
          </div>
          <div className="feed-list">
            {womanBookings.map((booking) => (
              <article key={booking._id} className="feed-card opportunity-card">
                <div className="feed-card-top">
                  <span className="category-tag">{booking.status}</span>
                  <span className="data-label">{new Date(booking.scheduledFor).toLocaleString()}</span>
                </div>
                <h3>{booking.taskType}</h3>
                <p>{booking.status === "accepted" || booking.status === "active" ? `${booking.worker?.name} confirmed ${booking.timeWindow}. Contact: in-app only.` : booking.notification?.message || booking.problem}</p>
                {booking.status === "active" && booking.tracking?.latitude && booking.tracking?.longitude && (
                  <MapContainer center={[booking.tracking.latitude, booking.tracking.longitude]} zoom={14} className="map-panel">
                    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[booking.tracking.latitude, booking.tracking.longitude]}>
                      <Popup>{booking.worker?.name || "Worker"} is active on this service</Popup>
                    </Marker>
                  </MapContainer>
                )}
                <div className="feed-card-bottom">
                  <span>{booking.worker?.ratingLabel || `${booking.area} · ${booking.timeWindow}`} · {booking.quotation}</span>
                  {booking.status === "active" && (
                    <button className="secondary-button small" onClick={refreshBookingTracking}><MapPin size={16} /> Refresh track</button>
                  )}
                  {(booking.status === "accepted" || booking.status === "active") && (
                    <button className="secondary-button small" onClick={() => markBookingComplete(booking._id)}><CheckCircle2 size={16} /> Complete</button>
                  )}
                  {booking.status === "completed" && booking.worker?._id && (
                    <RatingPicker onRate={(rating) => rateWorker(booking.worker._id, rating)} />
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {localityDialogOpen && (
        <div className="dialog-backdrop">
          <div className="locality-dialog">
            <div className="section-heading">
              <div>
                <h2>Choose by PIN code</h2>
              </div>
              <button type="button" className="secondary-button small" onClick={closeLocalityDialog}>Close</button>
            </div>
            <div className="locality-picker">
              <div className="relative">
                <input
                  className="field-input"
                  value={pincodeDraft}
                  onChange={(event) => handlePincodeInput(event.target.value)}
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="Enter 6 digit PIN code"
                />
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
              <button className="secondary-button" onClick={fetchLocalities} disabled={localityLoading || pincodeDraft.length !== 6}>
                {localityLoading ? "Checking..." : "Find"}
              </button>
            </div>
            {localityDraft && (
              <div className="locality-confirmation">
                <span>{locationDraft.area || localityDraft}</span>
                {locationDraft.district && <span>{locationDraft.district}</span>}
                {locationDraft.state && <span>{locationDraft.state}</span>}
                {locationDraft.pincode && <span>PIN {locationDraft.pincode}</span>}
              </div>
            )}
            {(previewSummary || summary) && (
              <div className="summary-grid compact-summary">
                <div><strong>{(previewSummary || summary).womenCount}</strong><span>women profiles</span></div>
                <div><strong>{(previewSummary || summary).workerCount}</strong><span>workers</span></div>
                <div><strong>{(previewSummary || summary).activeAlerts}</strong><span>active alerts</span></div>
                <div><strong>{(previewSummary || summary).openOpportunities.length}</strong><span>open tasks</span></div>
              </div>
            )}
            <div className="button-row">
              <button className="primary-button inline" onClick={saveLocality} disabled={!localityDraft}>Save locality</button>
              <button type="button" className="secondary-button" onClick={closeLocalityDialog}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {sharedLocations.length > 0 ? (
        <section className="page-panel">
          <div className="section-heading">
            <div>
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
        <EmptyState icon={MapPin} message="No trusted connection is sharing live location with you yet." />
      )}

      <section className="dashboard-columns">
        <div className="page-panel">
          <div className="section-heading">
            <div>
              <h2>Women Nearby</h2>
              <p className="section-caption">{womenNearby.length} local profiles</p>
            </div>
          </div>
          <div className="profile-grid">
            {womenNearby.length === 0 && <EmptyState icon={UsersRound} message="No nearby profiles yet. They will appear as women join your locality." />}
            {womenNearby.map((woman) => {
              const connected = connectedIds.has(String(woman._id));
              const requested = outgoingIds.has(String(woman._id));
              return (
                <article key={woman._id} className="profile-card woman-card">
                  <div className="anonymous-avatar woman-avatar"><UserRoundCheck size={20} /></div>
                  <div>
                    <h3>{woman.name}</h3>
                    <p><MapPin size={16} /> {woman.locality}</p>
                    <BadgePill variant="neutral">{woman.profession || "Community member"}</BadgePill>
                  </div>
                  {connected ? <BadgePill variant="success">Connected</BadgePill> : (
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
              <h2>Workers Nearby</h2>
              <p className="section-caption">{workersNearby.length} local workers</p>
            </div>
          </div>
          <div className="profile-grid">
            {workersNearby.length === 0 && <EmptyState icon={BriefcaseBusiness} message="No workers nearby yet. Recommended services will appear after community ratings." />}
            {workersNearby.map((worker) => (
              <article key={worker._id} className="profile-card worker-card">
                <div className="anonymous-avatar worker-avatar"><BriefcaseBusiness size={20} /></div>
                <div>
                  <h3>{worker.name}</h3>
                  <p>{worker.workType || "Worker"} in {worker.locality}</p>
                  <StarRating value={worker.safetyRating} count={worker.ratingCount} />
                </div>
                {worker.isRecommended && <BadgePill variant="success">Community recommended</BadgePill>}
                {currentUser.role === "woman" && (
                  <button className="small-button" onClick={() => openBooking(worker)}>Request booking</button>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {bookingWorker && (
        <form className="modal-card" onSubmit={submitBooking}>
          <div className="section-heading">
            <div>
              <h2>Request {bookingWorker.name}</h2>
              <p className="section-caption">Only task details, area, time, and notes go to the worker until acceptance.</p>
            </div>
            <button type="button" className="secondary-button small" onClick={() => setBookingWorker(null)}>Close</button>
          </div>
          <label className="field-label" htmlFor="taskType">Task type</label>
          <input id="taskType" className="field-input" value={bookingForm.taskType} onChange={(event) => setBookingForm({ ...bookingForm, taskType: event.target.value })} required />
          <label className="field-label" htmlFor="scheduledFor">Date and time</label>
          <input id="scheduledFor" className="field-input" type="datetime-local" value={bookingForm.scheduledFor} onChange={(event) => setBookingForm({ ...bookingForm, scheduledFor: event.target.value })} required />
          <label className="field-label" htmlFor="timeWindow">Time window</label>
          <input id="timeWindow" className="field-input" value={bookingForm.timeWindow} onChange={(event) => setBookingForm({ ...bookingForm, timeWindow: event.target.value })} placeholder="4:00 PM - 6:00 PM" required />
          <label className="field-label" htmlFor="problem">Problem / work details</label>
          <textarea id="problem" className="field-input textarea" value={bookingForm.problem} onChange={(event) => setBookingForm({ ...bookingForm, problem: event.target.value })} placeholder="Describe the problem or work needed" required />
          <label className="field-label" htmlFor="quotation">Quotation / budget</label>
          <input id="quotation" className="field-input" value={bookingForm.quotation} onChange={(event) => setBookingForm({ ...bookingForm, quotation: event.target.value })} placeholder="Example: Rs. 500 or please quote in app" required />
          <label className="field-label" htmlFor="area">General area</label>
          <input id="area" className="field-input" value={bookingForm.area} onChange={(event) => setBookingForm({ ...bookingForm, area: event.target.value })} required />
          <label className="field-label" htmlFor="exactAddress">Exact address</label>
          <input id="exactAddress" className="field-input" value={bookingForm.exactAddress} onChange={(event) => setBookingForm({ ...bookingForm, exactAddress: event.target.value })} required />
          <label className="field-label" htmlFor="notes">Notes</label>
          <textarea id="notes" className="field-input textarea" value={bookingForm.notes} onChange={(event) => setBookingForm({ ...bookingForm, notes: event.target.value })} />
          <div className="button-row">
            <button className="primary-button">Send request</button>
            <button type="button" className="secondary-button" onClick={() => setBookingWorker(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Dashboard;
