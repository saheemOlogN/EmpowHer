import { Loader2, Navigation, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { getCurrentLocality, getLocationSuggestions, getSelectedLocation } from "../services/location.js";

function Login({ message, onLogin }) {
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
  const [localMessage, setLocalMessage] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  async function handleChange(event) {
    const { name, value } = event.target;

    setFormData((oldData) => ({
      ...oldData,
      [name]: value
    }));

    if(name === "locality") {
      const results = await getLocationSuggestions(value);
      setSuggestions(results);
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
    setLocalMessage("");

    const data = await getCurrentLocality();

    if(!data.success) {
      setLocalMessage(data.message);
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
      setLocalMessage(data.message);
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

  async function handleSubmit(event) {
    event.preventDefault();
    setLoadingLogin(true);

    await onLogin(formData);

    setLoadingLogin(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <ShieldCheck size={28} />
          </div>
          <p className="mb-3 text-sm font-bold uppercase text-indigo-600">EmpowHer</p>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-slate-950 md:text-6xl">
            Safe local connections for women and trusted workers.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-slate-600">
            Login with your locality to see people and workers from the same area.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleRoleChange("woman")}
              className={formData.role === "woman" ? "role-button-active" : "role-button"}
            >
              Woman
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("worker")}
              className={formData.role === "worker" ? "role-button-active" : "role-button"}
            >
              Worker
            </button>
          </div>

          <label className="field-label" htmlFor="name">Name</label>
          <input className="field-input" id="name" name="name" value={formData.name} onChange={handleChange} />

          <label className="field-label" htmlFor="phone">Phone</label>
          <input className="field-input" id="phone" name="phone" value={formData.phone} onChange={handleChange} />

          <label className="field-label" htmlFor="gender">Gender</label>
          <select
            className="field-input"
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            disabled={formData.role === "woman"}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>

          {formData.role === "worker" && (
            <>
              <label className="field-label" htmlFor="workType">Work type</label>
              <input
                className="field-input"
                id="workType"
                name="workType"
                placeholder="Driver, electrician, plumber"
                value={formData.workType}
                onChange={handleChange}
              />
            </>
          )}

          <label className="field-label" htmlFor="locality">Locality</label>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <input
                className="field-input"
                id="locality"
                name="locality"
                value={formData.locality}
                onChange={handleChange}
              />
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-lg bg-white p-2 shadow-lg ring-1 ring-slate-200">
                  {suggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion.mapbox_id}
                      onClick={() => chooseSuggestion(suggestion)}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {suggestion.name}
                      {suggestion.place_formatted && <span className="block text-xs font-medium text-slate-500">{suggestion.place_formatted}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={detectLocation} className="location-button">
              {loadingLocation ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
              Detect
            </button>
          </div>

          <button type="submit" className="mt-6 flex min-h-12 w-full items-center justify-center rounded-lg bg-slate-950 px-4 font-bold text-white">
            {loadingLogin ? <Loader2 className="animate-spin" size={20} /> : "Login"}
          </button>

          {(message || localMessage) && (
            <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              {message || localMessage}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

export default Login;
