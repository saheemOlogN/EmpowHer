import { Heart, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { createExperience, getExperiences, toggleExperienceLike } from "../services/api.js";

const categories = [
  ["safety_tip", "Safety tip"],
  ["positive_experience", "Positive experience"],
  ["warning", "Warning"],
  ["general", "General"]
];

function Experiences({ currentUser }) {
  const [experiences, setExperiences] = useState([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", content: "", category: "general" });

  async function load() {
    const data = await getExperiences({ locality: currentUser.locality });
    if(data.success) setExperiences(data.experiences);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    const data = await createExperience(form);
    setMessage(data.message);

    if(data.success) {
      setForm({ title: "", content: "", category: "general" });
      setOpen(false);
      await load();
    }
  }

  async function like(id) {
    await toggleExperienceLike(id);
    await load();
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <p className="data-label">COMMUNITY NOTES</p>
          <h2>Experiences</h2>
        </div>
        <div>
          <button className="primary-button inline" onClick={() => setOpen(true)}><Plus size={17} /> Share your experience</button>
          <p className="privacy-note">Your name is shown, your phone number never is.</p>
        </div>
      </div>

      {message && <p className="notice">{message}</p>}

      {open && (
        <form className="modal-card" onSubmit={submit}>
          <label className="field-label" htmlFor="category">Category</label>
          <select className="field-input" id="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="field-label" htmlFor="title">Title</label>
          <input id="title" className="field-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <label className="field-label" htmlFor="content">Experience</label>
          <textarea id="content" className="field-input textarea" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required />
          <div className="button-row">
            <button className="primary-button">Share your experience</button>
            <button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      <section className="feed-list">
        {experiences.length === 0 && <p className="empty-text">No shared experiences in your area yet - safety tips and local notes will appear here as your community posts them.</p>}
        {experiences.map((item) => {
          const liked = item.likes?.some((id) => String(id) === currentUser._id);
          return (
            <article key={item._id} className={`feed-card experience-${item.category}`}>
              <div className="feed-card-top">
                <span className="category-tag">{item.category.replaceAll("_", " ")}</span>
                <span className="data-label">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
              <div className="feed-card-bottom">
                <span>Shared by {item.sharedBy?.name?.split(" ")[0] || "Community member"}</span>
                <button className={`like-button ${liked ? "liked" : ""}`} onClick={() => like(item._id)}>
                  <Heart size={17} fill={liked ? "currentColor" : "none"} />
                  {item.likes?.length || 0}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default Experiences;
