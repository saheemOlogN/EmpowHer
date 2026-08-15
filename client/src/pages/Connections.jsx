import { useEffect, useState } from "react";
import TrustSeal from "../components/TrustSeal.jsx";
import {
  acceptConnectionRequest,
  declineConnectionRequest,
  getConnections
} from "../services/api.js";

function Connections({ currentUser }) {
  const [tab, setTab] = useState("connections");
  const [data, setData] = useState({ accepted: [], pendingIncoming: [], pendingOutgoing: [] });
  const [message, setMessage] = useState("");

  async function load() {
    const response = await getConnections();
    if(response.success) setData(response);
  }

  useEffect(() => {
    load();
  }, []);

  async function accept(id) {
    const response = await acceptConnectionRequest(id);
    setMessage(response.message);
    await load();
  }

  async function decline(id) {
    const response = await declineConnectionRequest(id);
    setMessage(response.message);
    await load();
  }

  const otherPerson = (connection) => String(connection.requester._id) === currentUser._id ? connection.recipient : connection.requester;

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <p className="data-label">TRUSTED NETWORK</p>
          <h2>Connections</h2>
        </div>
      </div>

      {message && <p className="notice">{message}</p>}

      <div className="tabs">
        <button className={tab === "connections" ? "active" : ""} onClick={() => setTab("connections")}>Connections</button>
        <button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>
          Requests {data.pendingIncoming.length > 0 && <span />}
        </button>
      </div>

      {tab === "connections" ? (
        <section className="card-list">
          {data.accepted.length === 0 && <p className="empty-text">No accepted connections yet - send requests from your dashboard to build your trusted local network.</p>}
          {data.accepted.map((connection) => {
            const person = otherPerson(connection);
            return (
              <article className="list-card" key={connection._id}>
                <div>
                  <h3>{person.name}</h3>
                  <p>{person.role} · {person.locality}</p>
                </div>
                <TrustSeal label="CONNECTED" />
              </article>
            );
          })}
        </section>
      ) : (
        <section className="card-list">
          {data.pendingIncoming.length === 0 && <p className="empty-text">No pending requests - incoming connection requests will appear here.</p>}
          {data.pendingIncoming.map((connection) => (
            <article className="list-card" key={connection._id}>
              <div>
                <h3>{connection.requester.name}</h3>
                <p>{connection.requester.role} · {connection.requester.locality}</p>
              </div>
              <div className="button-row compact">
                <button className="small-button" onClick={() => accept(connection._id)}>Accept</button>
                <button className="secondary-button small" onClick={() => decline(connection._id)}>Decline</button>
              </div>
            </article>
          ))}
          {data.pendingOutgoing.length > 0 && <p className="data-label">OUTGOING REQUESTS</p>}
          {data.pendingOutgoing.map((connection) => (
            <article className="list-card" key={connection._id}>
              <div>
                <h3>{connection.recipient.name}</h3>
                <p>{connection.recipient.role} · {connection.recipient.locality}</p>
              </div>
              <button className="small-button" disabled>Requested</button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default Connections;
