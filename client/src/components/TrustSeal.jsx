import { Check, Star } from "lucide-react";

function TrustSeal({ label = "VERIFIED", tone = "check", muted = false }) {
  const Icon = tone === "star" ? Star : Check;

  return (
    <span className={`trust-seal ${muted ? "trust-seal-muted" : ""}`}>
      <span className="trust-seal-icon">
        <Icon size={14} fill={tone === "star" ? "currentColor" : "none"} />
      </span>
      <span>{label}</span>
    </span>
  );
}

export default TrustSeal;
