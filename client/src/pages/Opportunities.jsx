import { CheckCircle2, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { closeOpportunity, createOpportunity, getOpportunities } from "../services/api.js";

const defaultForm = {
  title: "",
  description: "",
  pay: "",
  category: "custom"
};

function Opportunities({ currentUser }) {
  const [opportunities, setOpportunities] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(defaultForm);

  async function load(nextSearch = search) {
    const data = await getOpportunities({ locality: currentUser.locality, search: nextSearch });
    if(data.success) {
      setOpportunities(data.opportunities);
    } else {
      setMessage(data.message);
    }
  }

  useEffect(() => {
    load("");
  }, [currentUser.locality]);

  async function submit(event) {
    event.preventDefault();
    const data = await createOpportunity(form);
    setMessage(data.message);

    if(data.success) {
      setForm(defaultForm);
      setOpen(false);
      await load();
    }
  }

  async function close(id) {
    const data = await closeOpportunity(id);
    setMessage(data.message);
    await load();
  }

  function updateSearch(value) {
    setSearch(value);
    load(value);
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <p className="data-label">LOCAL PAID TASKS</p>
          <h2>Opportunities</h2>
        </div>
        {currentUser.role === "woman" && (
          <button className="primary-button inline" onClick={() => setOpen(true)}><Plus size={17} /> Open opportunity</button>
        )}
      </div>

      {message && <p className="notice">{message}</p>}

      <section className="page-panel">
        <div className="search-row">
          <Search size={17} />
          <input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search babysitting, delivery, tutoring, errands" />
        </div>
        {currentUser.role === "worker" && (
          <p className="privacy-note">Worker view shows task details only. Women profiles, phone numbers, locations, and direct connections stay private.</p>
        )}
      </section>

      {open && (
        <form className="modal-card" onSubmit={submit}>
          <label className="field-label" htmlFor="category">Opportunity type</label>
          <select className="field-input" id="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            <option value="custom">Custom task</option>
            <option value="babysitting">Babysitting</option>
            <option value="home_help">Home help</option>
            <option value="teaching">Teaching</option>
            <option value="errand">Errand</option>
          </select>
          <label className="field-label" htmlFor="title">Title</label>
          <input id="title" className="field-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Need babysitting for Saturday evening" required />
          <label className="field-label" htmlFor="pay">Pay</label>
          <input id="pay" className="field-input" value={form.pay} onChange={(event) => setForm({ ...form, pay: event.target.value })} placeholder="Rs. 600 for 3 hours" required />
          <label className="field-label" htmlFor="description">Details</label>
          <textarea id="description" className="field-input textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          <div className="button-row">
            <button className="primary-button">Post opportunity</button>
            <button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      <section className="feed-list">
        {opportunities.length === 0 && <p className="empty-text">No open opportunities in {currentUser.locality} yet.</p>}
        {opportunities.map((item) => (
          <article key={item._id} className="feed-card opportunity-card">
            <div className="feed-card-top">
              <span className="category-tag">{item.category.replaceAll("_", " ")}</span>
              <span className="data-label">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="feed-card-bottom">
              <span>{item.pay} · {item.locality}</span>
              {currentUser.role === "woman" && String(item.postedBy?._id || item.postedBy) === currentUser._id && (
                <button className="secondary-button small" onClick={() => close(item._id)}><CheckCircle2 size={16} /> Close</button>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Opportunities;
