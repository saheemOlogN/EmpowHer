import { CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyBookings, startBookingService, updateBookingStatus, updateBookingTracking } from "../services/api.js";

function WorkerRequests() {
  const [requests, setRequests] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [active, setActive] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getMyBookings();

    if(data.success) {
      setRequests(data.bookings.filter((booking) => booking.status === "pending"));
      setAccepted(data.bookings.filter((booking) => booking.status === "accepted"));
      setActive(data.bookings.filter((booking) => booking.status === "active"));
    } else {
      setMessage(data.message);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    const refreshId = window.setInterval(load, 8000);
    return () => window.clearInterval(refreshId);
  }, []);

  async function respond(bookingId, status) {
    const data = await updateBookingStatus(bookingId, status);
    setMessage(data.message);
    await load();
  }

  async function startService(bookingId) {
    const data = await startBookingService(bookingId);
    setMessage(data.message);
    await load();
  }

  async function shareTracking(bookingId) {
    if(!navigator.geolocation) {
      setMessage("Location is not available in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const data = await updateBookingTracking(bookingId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setMessage(data.message);
        await load();
      },
      () => setMessage("Could not access location. Check browser permission."),
      { enableHighAccuracy: true }
    );
  }

  if(loading && requests.length === 0 && accepted.length === 0 && active.length === 0) {
    return <section className="page-panel">Loading requests...</section>;
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <p className="data-label">WORKER REQUESTS</p>
          <h2>Requests</h2>
        </div>
      </div>

      {message && <p className="notice">{message}</p>}

      <section className="page-panel">
        <div className="section-heading">
          <div>
            <h2>Pending</h2>
            <p className="section-caption">Only task details, time, area, and notes are shown.</p>
          </div>
        </div>
        <div className="feed-list">
          {requests.length === 0 && (
            <div className="empty-state">
              <CalendarClock size={20} />
              <span>No pending requests right now.</span>
            </div>
          )}
          {requests.map((request) => (
            <article key={request._id} className="feed-card opportunity-card">
              <div className="feed-card-top">
                <span className="category-tag">{request.taskType}</span>
                <span className="data-label">{new Date(request.scheduledFor).toLocaleString()}</span>
              </div>
              <h3>{request.timeWindow}</h3>
              <p>{request.problem}</p>
              <div className="feed-card-bottom">
                <span>{request.quotation} · {request.area}{request.notes ? ` · ${request.notes}` : ""}</span>
                <div className="button-row">
                  <button className="primary-button inline" onClick={() => respond(request._id, "accepted")}><CheckCircle2 size={16} /> Accept</button>
                  <button className="secondary-button small" onClick={() => respond(request._id, "rejected")}><XCircle size={16} /> Reject</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-panel">
        <div className="section-heading">
          <div>
            <h2>Accepted</h2>
            <p className="section-caption">Exact address unlocks only at the confirmed time.</p>
          </div>
        </div>
        <div className="feed-list">
          {accepted.length === 0 && <p className="empty-text">No accepted requests yet.</p>}
          {accepted.map((request) => (
            <article key={request._id} className="feed-card opportunity-card">
              <div className="feed-card-top">
                <span className="category-tag">{request.taskType}</span>
                <span className="data-label">{new Date(request.scheduledFor).toLocaleString()}</span>
              </div>
              <h3>{request.timeWindow}</h3>
              <p>{request.exactAddress ? `Address unlocked: ${request.exactAddress}` : "Exact address is locked until the confirmed time."}</p>
              <div className="feed-card-bottom">
                <span>{request.problem} · {request.quotation} · {request.area}</span>
                <button className="primary-button inline" onClick={() => startService(request._id)}><CheckCircle2 size={16} /> Start service</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-panel">
        <div className="section-heading">
          <div>
            <h2>Active</h2>
            <p className="section-caption">Share live progress while the service is active.</p>
          </div>
        </div>
        <div className="feed-list">
          {active.length === 0 && <p className="empty-text">No active service right now.</p>}
          {active.map((request) => (
            <article key={request._id} className="feed-card opportunity-card">
              <div className="feed-card-top">
                <span className="category-tag">Active</span>
                <span className="data-label">{new Date(request.scheduledFor).toLocaleString()}</span>
              </div>
              <h3>{request.taskType}</h3>
              <p>{request.exactAddress ? `Address unlocked: ${request.exactAddress}` : "Exact address is locked until the confirmed time."}</p>
              <div className="feed-card-bottom">
                <span>{request.tracking?.updatedAt ? `Tracking shared ${new Date(request.tracking.updatedAt).toLocaleTimeString()}` : "Tracking not shared yet"} · in-app only</span>
                <button className="primary-button inline" onClick={() => shareTracking(request._id)}><CheckCircle2 size={16} /> Share tracking</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default WorkerRequests;
