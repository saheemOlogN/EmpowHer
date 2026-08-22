import { AlertTriangle, LocateFixed, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { analyzeArea } from "../services/safetyService.js";

const riskTone = {
  low: "success",
  moderate: "warning",
  high: "danger"
};

function FactorCard({ title, factor }) {
  return (
    <article className="analysis-factor">
      <div>
        <span className="data-label">{title}</span>
        <strong>{factor?.score ?? "--"}</strong>
      </div>
      <p>{factor?.note || "No signal returned."}</p>
    </article>
  );
}

function SafetyAnalysis({ currentUser }) {
  const [analysis, setAnalysis] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({
    lat: currentUser.latitude || "",
    lng: currentUser.longitude || ""
  });

  function useMyLocation() {
    if(!navigator.geolocation) {
      setMessage("Location is not available in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (location) => {
        setPosition({
          lat: location.coords.latitude,
          lng: location.coords.longitude
        });
        setMessage("Location added for this analysis");
      },
      () => setMessage("Couldn't access location - check browser permission"),
      { enableHighAccuracy: true }
    );
  }

  async function runAnalysis(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const data = await analyzeArea(currentUser.locality, position.lat, position.lng);
    setLoading(false);

    if(data.success) {
      setAnalysis(data);
      return;
    }

    setAnalysis(null);
    setMessage(data.message || "Could not analyze this area");
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <p className="data-label">AREA SAFETY ANALYSIS</p>
          <h2>Safety Analysis</h2>
        </div>
        <button className="secondary-button" onClick={useMyLocation}>
          <LocateFixed size={17} />
          Use location
        </button>
      </div>

      {message && <p className="notice">{message}</p>}

      <section className="page-panel analysis-hero">
        <div>
          <span className="locality-badge"><ShieldCheck size={15} /> {currentUser.location?.area || "Current locality"}</span>
          <h3>{currentUser.locality}</h3>
          <p>Analyze this locality using community incident reports, current time risk, and OpenStreetMap lighting and crowd-density proxy signals.</p>
        </div>
        <form className="analysis-form" onSubmit={runAnalysis}>
          <label className="field-label" htmlFor="lat">Latitude</label>
          <input id="lat" className="field-input" value={position.lat} onChange={(event) => setPosition({ ...position, lat: event.target.value })} placeholder="16.9902" />
          <label className="field-label" htmlFor="lng">Longitude</label>
          <input id="lng" className="field-input" value={position.lng} onChange={(event) => setPosition({ ...position, lng: event.target.value })} placeholder="73.3120" />
          <button className="primary-button" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze area"}
          </button>
        </form>
      </section>

      {analysis && (
        <section className="page-panel analysis-results">
          <div className="analysis-score">
            <div>
              <span className={`badge-pill ${riskTone[analysis.riskLevel] || "neutral"}`}>{analysis.riskLevel} risk</span>
              <h3>{analysis.overallScore}/100</h3>
              <p>{analysis.summary}</p>
            </div>
            <AlertTriangle size={42} />
          </div>
          <div className="analysis-factor-grid">
            <FactorCard title="Crime history" factor={analysis.factors?.crimeHistory} />
            <FactorCard title="Time of day" factor={analysis.factors?.timeOfDay} />
            <FactorCard title="Lighting" factor={analysis.factors?.lighting} />
            <FactorCard title="Crowd density" factor={analysis.factors?.crowdDensity} />
          </div>
          <div className="recommendation-strip">
            <strong>Recommendation</strong>
            <p>{analysis.recommendation}</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default SafetyAnalysis;
