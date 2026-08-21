import { useEffect, useState } from "react";
import { createAlert, getAlerts, resolveAlert } from "../services/api.js";
import TrustSeal from "../components/TrustSeal.jsx";

const alertTypes = [
  ["unsafe_area", "Unsafe area"],
  ["harassment", "Harassment"],
  ["suspicious_activity", "Suspicious activity"],
  ["other", "Other"]
];

function Alerts({ currentUser }) {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ type: "unsafe_area", description: "" });

  async function load() {
    const data = await getAlerts(currentUser.locality);
    if(data.success) setAlerts(data.alerts);
  }

  useEffect(() => {
    load();
    const refreshId = window.setInterval(load, 8000);
    const handleLiveUpdate = () => load();

    window.addEventListener("empowher:live-update", handleLiveUpdate);

    return () => {
      window.clearInterval(refreshId);
      window.removeEventListener("empowher:live-update", handleLiveUpdate);
    };
  }, [currentUser.locality]);

  async function submit(event) {
    event.preventDefault();
    const data = await createAlert({ ...form, locality: currentUser.locality });
    setMessage(data.message);

    if(data.success) {
      setForm({ type: "unsafe_area", description: "" });
      setOpen(false);
      await load();
      window.dispatchEvent(new CustomEvent("empowher:live-update", { detail: { source: "alert-created" } }));
    }
  }

  async function markResolved(alertId) {
    const data = await resolveAlert(alertId);
    setMessage(data.message);
    await load();
    if(data.success) {
      window.dispatchEvent(new CustomEvent("empowher:live-update", { detail: { source: "alert-resolved" } }));
    }
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <p className="data-label">LOCAL SAFETY FEED</p>
          <h2>Alerts</h2>
        </div>
        <button className="outline-coral-button" onClick={() => setOpen(true)}>Raise alert</button>
      </div>

      {message && <p className="notice">{message}</p>}

      {open && (
        <form className="modal-card" onSubmit={submit}>
          <label className="field-label" htmlFor="type">Alert type</label>
          <select className="field-input" id="type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            {alertTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="field-label" htmlFor="description">Description</label>
          <textarea id="description" className="field-input textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          <div className="button-row">
            <button className="primary-button">Raise alert</button>
            <button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      <section className="feed-list">
        {alerts.length === 0 && <p className="empty-text">No alerts in your area yet - you'll see them here as your community reports them.</p>}
        {alerts.map((alert) => (
          <article key={alert._id} className={`feed-card alert-${alert.type}`}>
            <div className="feed-card-top">
              <strong>{alert.type.replaceAll("_", " ")}</strong>
              <span className="data-label">{new Date(alert.createdAt).toLocaleString()} · {alert.locality}</span>
            </div>
            <p>{alert.description}</p>
            <div className="feed-card-bottom">
              {alert.status === "resolved" ? <TrustSeal label="RESOLVED" /> : <span className="status-active">ACTIVE</span>}
              {alert.status === "active" && String(alert.raisedBy?._id) === currentUser._id && (
                <button className="small-button" onClick={() => markResolved(alert._id)}>Resolve</button>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Alerts;
