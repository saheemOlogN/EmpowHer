import { Landmark, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getRecommendedSchemes } from "../services/schemeService.js";

function Schemes({ currentUser }) {
  const [schemes, setSchemes] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getRecommendedSchemes();
    setLoading(false);

    if(data.success) {
      setSchemes(data.schemes || []);
      setMessage(data.message || "");
      return;
    }

    setSchemes([]);
    setMessage(data.message || "Could not load scheme recommendations");
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <p className="data-label">SCHEMED</p>
          <h2>Scheme Matcher</h2>
        </div>
        <button className="secondary-button" onClick={load} disabled={loading}>
          <Sparkles size={17} />
          Refresh
        </button>
      </div>

      <section className="page-panel scheme-profile-panel">
        <div>
          <span className="locality-badge"><Landmark size={15} /> {currentUser.location?.state || currentUser.state || "State not set"}</span>
          <h3>{currentUser.name}</h3>
          <p>{[currentUser.occupation, currentUser.age ? `${currentUser.age} years` : "", currentUser.annualIncome ? `Income Rs. ${currentUser.annualIncome}` : ""].filter(Boolean).join(" · ") || "Profile details can improve matching."}</p>
        </div>
      </section>

      {message && <p className="notice">{message}</p>}
      {loading && <section className="page-panel">Finding matching schemes...</section>}

      {!loading && schemes.length === 0 && (
        <p className="empty-text">No scheme matches yet. Add age, occupation, state, income, category, or motherhood details to your profile data to unlock more matches.</p>
      )}

      <section className="scheme-grid">
        {schemes.map((scheme) => (
          <article key={scheme.id} className="feed-card scheme-card">
            <div className="feed-card-top">
              <strong>{scheme.name}</strong>
              <span className="badge-pill brand">Eligible match</span>
            </div>
            <p>{scheme.personalizedNote || scheme.forWhom}</p>
            <div className="scheme-detail">
              <span>For whom</span>
              <p>{scheme.forWhom}</p>
            </div>
            <div className="scheme-detail">
              <span>Benefit</span>
              <p>{scheme.benefit}</p>
            </div>
            <div className="feed-card-bottom">
              <a className="secondary-button small" href={scheme.officialLink} target="_blank" rel="noreferrer">Official link</a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Schemes;
