import { Loader2, Navigation, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { getCurrentLocality, getLocationSuggestions, getSelectedLocation } from "../services/location.js";
import { sendOtp, verifyOtp } from "../services/api.js";

function Login({ onLogin }) {
  const [step, setStep] = useState("details");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "woman",
    gender: "female",
    workType: "",
    locality: "",
    latitude: "",
    longitude: ""
  });
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [message, setMessage] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const otpRefs = useRef([]);

  async function handleChange(event) {
    const { name, value } = event.target;
    setFormData((oldData) => ({ ...oldData, [name]: value }));

    if(name === "locality") {
      setSuggestions(await getLocationSuggestions(value));
    }
  }

  function handleRoleChange(role) {
    setFormData((oldData) => ({
      ...oldData,
      role,
      gender: role === "woman" ? "female" : oldData.gender
    }));
  }

  async function detectLocation() {
    setLoadingLocation(true);
    setMessage("");
    const data = await getCurrentLocality();

    if(!data.success) {
      setMessage(data.message);
      setLoadingLocation(false);
      return;
    }

    setFormData((oldData) => ({
      ...oldData,
      locality: data.locality,
      latitude: data.latitude,
      longitude: data.longitude
    }));
    setLoadingLocation(false);
  }

  async function chooseSuggestion(suggestion) {
    const data = await getSelectedLocation(suggestion.mapbox_id);

    if(!data.success) {
      setMessage(data.message);
      return;
    }

    setFormData((oldData) => ({
      ...oldData,
      locality: data.locality,
      latitude: data.latitude,
      longitude: data.longitude
    }));
    setSuggestions([]);
  }

  async function requestOtp(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const data = await sendOtp(formData);
    setLoading(false);

    if(!data.success) {
      setMessage(data.message);
      return;
    }

    setDemoOtp(data.otp);
    setMessage(`${data.message}. Demo code: ${data.otp}`);
    setStep("otp");
    window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
  }

  async function submitOtp(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const data = await verifyOtp({ ...formData, code: otp.join("") });
    setLoading(false);

    if(!data.success) {
      setMessage(data.message);
      return;
    }

    onLogin({ token: data.token, user: data.user });
  }

  function updateOtp(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((old) => old.map((item, itemIndex) => itemIndex === index ? digit : item));

    if(digit && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  return (
    <main className="login-screen">
      <section className="login-grid">
        <div className="login-brand">
          <div className="brand-icon large"><ShieldCheck size={30} /></div>
          <p className="data-label">EMPOWHER</p>
          <h1>Verified local trust for safer everyday movement.</h1>
          <p>Sign in with your locality to see nearby women, trusted workers, community alerts, and practical safety guidance.</p>
        </div>

        <form onSubmit={step === "details" ? requestOtp : submitOtp} className="login-card">
          {step === "details" ? (
            <>
              <div className="role-toggle">
                <button type="button" onClick={() => handleRoleChange("woman")} className={formData.role === "woman" ? "role-button-active" : "role-button"}>Woman</button>
                <button type="button" onClick={() => handleRoleChange("worker")} className={formData.role === "worker" ? "role-button-active" : "role-button"}>Worker</button>
              </div>

              <label className="field-label" htmlFor="name">Name</label>
              <input className="field-input" id="name" name="name" value={formData.name} onChange={handleChange} required />

              <label className="field-label" htmlFor="phone">Phone</label>
              <input className="field-input" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />

              <label className="field-label" htmlFor="gender">Gender</label>
              <select className="field-input" id="gender" name="gender" value={formData.gender} onChange={handleChange} disabled={formData.role === "woman"}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>

              {formData.role === "worker" && (
                <>
                  <label className="field-label" htmlFor="workType">Work type</label>
                  <input className="field-input" id="workType" name="workType" placeholder="Driver, electrician, plumber" value={formData.workType} onChange={handleChange} />
                </>
              )}

              <label className="field-label" htmlFor="locality">Locality</label>
              <div className="locality-picker">
                <div className="relative">
                  <input className="field-input" id="locality" name="locality" value={formData.locality} onChange={handleChange} required />
                  {suggestions.length > 0 && (
                    <div className="suggestions">
                      {suggestions.map((suggestion) => (
                        <button type="button" key={suggestion.mapbox_id} onClick={() => chooseSuggestion(suggestion)}>
                          {suggestion.name}
                          {suggestion.place_formatted && <span>{suggestion.place_formatted}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={detectLocation} className="location-button">
                  {loadingLocation ? <Loader2 className="spin" size={18} /> : <Navigation size={18} />}
                  Detect
                </button>
              </div>
            </>
          ) : (
            <div>
              <p className="data-label">4 DIGIT VERIFICATION</p>
              <h2>Enter the code sent to {formData.phone}</h2>
              <div className="otp-row">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { otpRefs.current[index] = element; }}
                    value={digit}
                    inputMode="numeric"
                    maxLength="1"
                    onChange={(event) => updateOtp(index, event.target.value)}
                    onKeyDown={(event) => {
                      if(event.key === "Backspace" && !otp[index] && index > 0) {
                        otpRefs.current[index - 1]?.focus();
                      }
                    }}
                  />
                ))}
              </div>
              {demoOtp && <p className="demo-code">DEMO CODE {demoOtp}</p>}
              <button type="button" className="text-button" onClick={() => setStep("details")}>Edit details</button>
            </div>
          )}

          <button type="submit" className="primary-button">
            {loading ? <Loader2 className="spin" size={20} /> : step === "details" ? "Send verification code" : "Verify and continue"}
          </button>

          {message && <p className="form-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}

export default Login;
