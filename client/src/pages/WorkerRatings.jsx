import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyWorkerRatings } from "../services/api.js";

function WorkerRatings({ currentUser }) {
  const [summary, setSummary] = useState({
    safetyRating: currentUser.safetyRating || 0,
    ratingCount: currentUser.ratingCount || 0,
    ratingLabel: `${currentUser.safetyRating || 0} from ${currentUser.ratingCount || 0} ratings`
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const data = await getMyWorkerRatings();
      if(data.success) {
        setSummary(data.rating);
      } else {
        setMessage(data.message);
      }
    }

    load();
  }, []);

  const rounded = Math.round(Number(summary.safetyRating || 0) * 2) / 2;

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <p className="data-label">WORKER RATINGS</p>
          <h2>My Ratings</h2>
        </div>
      </div>

      {message && <p className="notice">{message}</p>}

      <section className="page-panel">
        <div className="section-heading">
          <div>
            <h2>{summary.ratingLabel}</h2>
            <p className="section-caption">Ratings are shown only as an aggregate score.</p>
          </div>
        </div>
        <div className="rating-display" aria-label={`${rounded} out of 5 stars from ${summary.ratingCount || 0} ratings`}>
          <span className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => {
              const fill = rounded >= star ? "full" : rounded >= star - 0.5 ? "half" : "empty";
              return <Star key={star} size={22} className={`star-${fill}`} fill="currentColor" />;
            })}
          </span>
          <span>{rounded || 0} from {summary.ratingCount || 0} ratings</span>
        </div>
      </section>
    </div>
  );
}

export default WorkerRatings;
