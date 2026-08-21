import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useRef, useState } from "react";
import TrustSeal from "../components/TrustSeal.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.jsx";
import { completeSignup, runIdentityCheck, sendSignupOtp, verifySignupOtp } from "../services/api.js";
import { getLocationSuggestions, getSelectedLocation } from "../services/location.js";
import logoUrl from "../assets/empowher-logo.png";

const steps = ["details", "phone", "identity", "done"];

function Signup({ onLogin }) {
  const [step, setStep] = useState("details");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "woman",
    gender: "female",
    workType: "",
    profession: "",
    maritalStatus: "",
    locality: "",
    location: {
      pincode: "",
      area: "",
      district: "",
      state: ""
    },
    latitude: "",
    longitude: ""
  });
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [demoOtp, setDemoOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localityLoading, setLocalityLoading] = useState(false);
  const [pincode, setPincode] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const otpRefs = useRef([]);

  const visibleStep = form.role === "worker" && step === "identity" ? "done" : step;
  const progressIndex = steps.indexOf(visibleStep);

  function updateForm(name, value) {
    setForm((old) => ({
      ...old,
      [name]: value,
      ...(name === "role" ? { gender: value === "woman" ? "female" : old.gender } : {})
    }));
  }

  function handlePincode(value) {
    const nextPincode = value.replace(/\D/g, "").slice(0, 6);

    setPincode(nextPincode);
    setSuggestions([]);
    setForm((old) => ({
      ...old,
      locality: "",
      location: {
        pincode: nextPincode,
        area: "",
        district: "",
        state: ""
      },
      latitude: "",
      longitude: ""
    }));
  }

  async function fetchLocalities() {
    if(pincode.length !== 6) {
      toast.error("Enter a valid 6 digit PIN code");
      return;
    }

    setLocalityLoading(true);
    const data = await getLocationSuggestions(pincode);
    setLocalityLoading(false);

    if(!data.success) {
      setSuggestions([]);
      toast.error(data.message);
      return;
    }

    setSuggestions(data.suggestions);
  }

  async function chooseSuggestion(suggestion) {
    const data = await getSelectedLocation(suggestion);

    if(!data.success) {
      toast.error(data.message);
      return;
    }

    setForm((old) => ({
      ...old,
      locality: data.locality,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude
    }));
    setSuggestions([]);
    toast.success(data.message);
  }

  async function sendOtp(event) {
    event.preventDefault();

    if(form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const data = await sendSignupOtp(form);
    setLoading(false);

    if(!data.success) {
      toast.error(data.message);
      return;
    }

    setDemoOtp(data.otp);
    toast.success(`${data.message}. Demo code: ${data.otp}`);
    setStep("phone");
    window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setLoading(true);
    const data = await verifySignupOtp({ phone: form.phone, code: otp.join("") });
    setLoading(false);

    if(!data.success) {
      toast.error(data.message);
      return;
    }

    setOtpVerified(true);
    toast.success(data.message);
    setStep(form.role === "woman" ? "identity" : "done");
  }

  async function identityCheck() {
    setLoading(true);
    const data = await runIdentityCheck({ phone: form.phone });
    setLoading(false);

    if(!data.success) {
      toast.error(data.message);
      return;
    }

    setIdentityVerified(true);
    toast.success(data.message);
  }

  async function finishSignup() {
    if(!otpVerified) {
      toast.error("Verify your phone before completing signup");
      return;
    }

    if(form.role === "woman" && !identityVerified) {
      toast.error("Run the demo identity check before completing signup");
      return;
    }

    setLoading(true);
    const data = await completeSignup(form);
    setLoading(false);

    if(!data.success) {
      toast.error(data.message);
      return;
    }

    toast.success(data.message);
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
          <div className="auth-brand-lockup">
            <img src={logoUrl} alt="EmpowHer" />
            <div>
              <p className="wordmark light">EmpowHer</p>
              <span>Changing Locality to a Community</span>
            </div>
          </div>
          <p className="data-label">SIGNUP</p>
          <h1>Verified local trust for safer everyday movement.</h1>
          <p>Create your community account with phone verification, PIN-code locality selection, and a simulated identity check for women.</p>
        </div>

        <Card className="login-card">
          <CardContent className="p-0">
            <div className="step-indicator" aria-label="Signup progress">
              {steps.map((item, index) => (
                <span key={item} className={index <= progressIndex ? "active" : ""} />
              ))}
            </div>

            {visibleStep === "details" && (
              <form className="form-stack" onSubmit={sendOtp}>
                <div className="role-toggle">
                  <button type="button" onClick={() => updateForm("role", "woman")} className={form.role === "woman" ? "role-button-active" : "role-button"}>Woman</button>
                  <button type="button" onClick={() => updateForm("role", "worker")} className={form.role === "worker" ? "role-button-active" : "role-button"}>Worker</button>
                </div>
                <div><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} required /></div>
                <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} required /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} required /></div>
                <div className="split-fields">
                  <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} required /></div>
                  <div><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(event) => updateForm("confirmPassword", event.target.value)} required /></div>
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(value) => updateForm("gender", value)} disabled={form.role === "woman"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.role === "worker" && <div><Label htmlFor="workType">Work type</Label><Input id="workType" value={form.workType} onChange={(event) => updateForm("workType", event.target.value)} placeholder="Driver, electrician, plumber" /></div>}
                {form.role === "woman" && (
                  <div className="split-fields">
                    <div><Label htmlFor="profession">Profession</Label><Input id="profession" value={form.profession} onChange={(event) => updateForm("profession", event.target.value)} placeholder="Teacher, student, homemaker" required /></div>
                    <div>
                      <Label>Marital status</Label>
                      <Select value={form.maritalStatus} onValueChange={(value) => updateForm("maritalStatus", value)}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                          <SelectItem value="separated">Separated</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="locality">Locality</Label>
                  <div className="locality-picker">
                    <div className="relative">
                      <Input
                        id="locality"
                        value={pincode}
                        onChange={(event) => handlePincode(event.target.value)}
                        inputMode="numeric"
                        maxLength="6"
                        placeholder="Enter 6 digit PIN code"
                        required
                      />
                      {suggestions.length > 0 && (
                        <div className="suggestions">
                          {suggestions.map((suggestion) => (
                            <button type="button" key={suggestion.id} onClick={() => chooseSuggestion(suggestion)}>
                              {suggestion.name}
                              {suggestion.placeFormatted && <span>{suggestion.placeFormatted}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="secondary" onClick={fetchLocalities} disabled={localityLoading || pincode.length !== 6}>
                      {localityLoading ? "Checking..." : "Find"}
                    </Button>
                  </div>
                  {form.locality && (
                    <div className="locality-confirmation">
                      <span>{form.location.area}</span>
                      <span>{form.location.district}</span>
                      <span>{form.location.state}</span>
                      <span>PIN {form.location.pincode}</span>
                    </div>
                  )}
                </div>
                <Button disabled={loading}>{loading ? "Sending..." : "Send verification code"}</Button>
                <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
              </form>
            )}

            {visibleStep === "phone" && (
              <form className="form-stack" onSubmit={verifyOtp}>
                <div>
                  <p className="data-label">4 DIGIT VERIFICATION</p>
                  <h2>Enter the code sent to {form.phone}</h2>
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
                          if(event.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
                        }}
                      />
                    ))}
                  </div>
                  {demoOtp && <p className="demo-code">DEMO CODE {demoOtp}</p>}
                </div>
                <Button disabled={loading}>{loading ? "Verifying..." : "Verify phone"}</Button>
              </form>
            )}

            {visibleStep === "identity" && (
              <div className="identity-step">
                <p>We confirm women signing up are women, to keep this community trustworthy.</p>
                {identityVerified ? (
                  <TrustSeal label="IDENTITY CONFIRMED" />
                ) : (
                  <Button onClick={identityCheck} disabled={loading}>{loading ? "Checking..." : "Run identity check"}</Button>
                )}
                <p className="muted-copy">Demo mode - production uses DigiLocker verification, not stored ID documents.</p>
                <Button variant="sage" onClick={() => setStep("done")} disabled={!identityVerified}>Continue</Button>
              </div>
            )}

            {visibleStep === "done" && (
              <div className="identity-step">
                <TrustSeal label={form.role === "woman" ? "IDENTITY CONFIRMED" : "PHONE CONFIRMED"} />
                <h2>Ready to enter EmpowHer</h2>
                <p className="muted-copy">Your account will be created now. Passwords are stored as hashes only.</p>
                <Button onClick={finishSignup} disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default Signup;
