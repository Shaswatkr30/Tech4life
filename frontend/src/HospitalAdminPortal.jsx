import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BedDouble, CheckCircle2, ClipboardCheck, Droplets, HeartPulse, Hospital, LogIn, LogOut, MapPin, ShieldCheck, UserPlus, Wrench } from "lucide-react";
import EmergencyInbox from "./EmergencyInbox.jsx";
import "./HospitalAdminPortal.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || "Unable to complete this request.");
  return data;
}

function HospitalAdminPortal({ mode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ hospital_id: "", name: "", email: "", password: "" });
  const [hospitals, setHospitals] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [resources, setResources] = useState({ blood: [], icu: [], organs: [], equipment: [] });
  const [verification, setVerification] = useState({ is_verified: false, note: "", updated_at: null });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const token = localStorage.getItem("tech4life_hospital_admin_token");

  useEffect(() => {
    if (mode === "register") request(`${API}/api/hospital-admin/hospitals`).then(setHospitals).catch((err) => setError(err.message));
    if (mode === "dashboard") {
      if (!token) { navigate("/hospital-admin/login"); return; }
      loadDashboard();
    }
  }, [mode]);

  async function loadDashboard() {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [adminData, hospitalData, blood, icu, organs, equipment, review] = await Promise.all([
        request(`${API}/api/hospital-admin/me`, { headers }),
        request(`${API}/api/hospitals/me`, { headers }),
        request(`${API}/api/blood/my`, { headers }),
        request(`${API}/api/icu/my`, { headers }),
        request(`${API}/api/organs/my`, { headers }),
        request(`${API}/api/equipment/my`, { headers }),
        request(`${API}/api/hospital-admin/verification`, { headers }),
      ]);
      setAdmin(adminData); setHospital(hospitalData);
      setResources({ blood, icu, organs, equipment }); setVerification(review);
    } catch (err) {
      setError(err.message);
      if (err.message.toLowerCase().includes("token") || err.message.toLowerCase().includes("inactive")) navigate("/hospital-admin/login");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "login") {
        const data = await request(`${API}/api/hospital-admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, password: form.password }) });
        localStorage.setItem("tech4life_hospital_admin_token", data.access_token);
        navigate("/hospital-admin/dashboard");
      } else {
        const data = await request(`${API}/api/hospital-admin/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, hospital_id: Number(form.hospital_id) }) });
        setNotice(data.message); setForm({ hospital_id: "", name: "", email: "", password: "" });
      }
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function sendResetCode() {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request(`${API}/api/auth/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_type: "hospital_admin", identifier: form.email }) });
      setNotice(result.message); setResetSent(true);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function resetAdminPassword(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const result = await request(`${API}/api/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_type: "hospital_admin", identifier: form.email, otp: resetOtp, password: resetPassword }) });
      setResetComplete(true); setNotice(result.message);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  function handleRecoverySubmit(event) {
    if (!resetSent) { event.preventDefault(); sendResetCode(); return; }
    resetAdminPassword(event);
  }

  async function saveReview(isVerified) {
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await request(`${API}/api/hospital-admin/verification`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ is_verified: isVerified, note: verification.note || "" }) });
      setVerification(data); setNotice(isVerified ? "Verification complete. Approved information is now visible in the public directory." : "Review reopened. Hospital information is hidden from the public directory until verified again.");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (mode === "dashboard") return <main className="hospital-admin-page">
    <header className="ha-header"><div><span className="ha-eyebrow"><ShieldCheck size={16} /> HOSPITAL ADMIN WORKSPACE</span><h1>{hospital?.name || "Hospital review"}</h1><p>Signed in as {admin?.name} · Review the information submitted by your hospital before publishing it.</p></div><button className="ha-logout" onClick={() => { localStorage.removeItem("tech4life_hospital_admin_token"); navigate("/hospital-admin/login"); }}><LogOut size={16} /> Sign out</button></header>
    {error && <div className="ha-alert error" role="alert">{error}</div>}{notice && <div className="ha-alert success" role="status"><CheckCircle2 size={17} />{notice}</div>}
    {hospital && <section className="ha-overview"><div className="ha-hospital-icon"><Hospital size={24} /></div><div><span>YOUR HOSPITAL</span><h2>{hospital.name}</h2><p><MapPin size={14} /> {hospital.address}, {hospital.city}, {hospital.state}</p></div><div className={`ha-publish-status ${verification.is_verified ? "verified" : "pending"}`}><span />{verification.is_verified ? "Verified · Public" : "Awaiting your review"}</div></section>}
    <EmergencyInbox token={token} />
    <section className="ha-review-panel"><div className="ha-review-heading"><div className="ha-review-icon"><ClipboardCheck size={22} /></div><div><span className="ha-eyebrow">ADMIN VERIFICATION</span><h2>Check and verify hospital information</h2><p>Confirm that the hospital profile and all resource quantities below are accurate and up to date.</p></div></div>
      <div className="ha-profile-grid"><div><span>Contact email</span><strong>{hospital?.email}</strong></div><div><span>Phone</span><strong>{hospital?.phone || "Not provided"}</strong></div><div><span>City and state</span><strong>{hospital?.city}, {hospital?.state}</strong></div><div><span>Address</span><strong>{hospital?.address}</strong></div></div>
      <div className="ha-resource-grid">{[["Blood inventory", Droplets, resources.blood, (x) => `${x.blood_group} · ${x.units_available} units`], ["ICU beds", BedDouble, resources.icu, (x) => `${x.available_beds} available / ${x.total_beds} total`], ["Organ availability", HeartPulse, resources.organs, (x) => `${x.organ_name} · ${x.available ? "Available" : "Unavailable"}`], ["Medical equipment", Wrench, resources.equipment, (x) => `${x.equipment_name} · ${x.available_quantity}/${x.total_quantity} available`]].map(([title, Icon, items, label]) => <article className="ha-resource-card" key={title}><h3><Icon size={17} />{title}<span>{items.length}</span></h3>{items.length ? <ul>{items.map((item) => <li key={item.id}>{label(item)}</li>)}</ul> : <p>No information submitted yet.</p>}</article>)}</div>
      <label className="ha-note">Verification note <span>Optional</span><textarea maxLength={1000} value={verification.note || ""} onChange={(event) => setVerification({ ...verification, note: event.target.value })} placeholder="Note any corrections or details checked during this review" /></label>
      <footer className="ha-review-actions"><div><span className={`ha-review-state ${verification.is_verified ? "verified" : "pending"}`}><span />{verification.is_verified ? "Verified listing" : "Not yet verified"}</span>{verification.updated_at && <small>Last reviewed {new Date(verification.updated_at).toLocaleString("en-IN")}</small>}</div><div><button className="ha-confirm" disabled={busy} onClick={() => saveReview(true)}><CheckCircle2 size={17} />{busy ? "Saving…" : "Verify and publish"}</button>{verification.is_verified && <button className="ha-reopen" disabled={busy} onClick={() => saveReview(false)}>Reopen review</button>}</div></footer>
    </section>
  </main>;

  return <main className="hospital-admin-auth"><section className="ha-auth-card"><div className="ha-auth-mark">{mode === "login" ? <LogIn size={25} /> : <UserPlus size={25} />}</div><span className="ha-eyebrow">TECH4LIFE · HOSPITAL ADMIN</span><h1>{mode === "login" ? "Hospital admin sign in" : "Request an admin account"}</h1><p>{mode === "login" ? "Sign in to review and verify your hospital’s information." : "Register the administrator for your hospital. The Tech4Life Admin Portal must approve your account before you can sign in."}</p>
    {error && <div className="ha-alert error" role="alert">{error}</div>}{notice && <div className="ha-alert success" role="status">{notice}</div>}
    {resetComplete ? <div className="ha-alert success" role="status"><CheckCircle2 size={17} />Password reset. You can now sign in.</div> : <form onSubmit={resetMode ? handleRecoverySubmit : handleSubmit}>{mode === "register" && <><label>Registered hospital<select required value={form.hospital_id} onChange={(e) => setForm({ ...form, hospital_id: e.target.value })}><option value="">Choose your hospital</option>{hospitals.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.city}, {item.state}</option>)}</select></label><label>Admin name<input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></label></>}
      <label>Admin email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@hospital.org" autoComplete="username" /></label>{resetMode && resetSent ? <><label>Six-digit Gmail code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g, ""))} /></label><label>New password<input type="password" minLength={8} required value={resetPassword} onChange={e => setResetPassword(e.target.value)} autoComplete="new-password" /></label></> : <label>Password<input type="password" required minLength={mode === "register" ? 8 : 1} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={mode === "register" ? "At least 8 characters" : "Your password"} autoComplete={mode === "register" ? "new-password" : "current-password"} /></label>}{mode === "login" && !resetMode && <button type="button" className="ha-forgot-link" onClick={() => { setResetMode(true); setResetSent(false); setResetComplete(false); setError(""); setNotice(""); }}>Forgot password? Get a Gmail code</button>}{error && <div className="ha-alert error" role="alert">{error}</div>}<button className="ha-confirm full" disabled={busy}>{busy ? "Please wait…" : resetMode ? resetSent ? "Verify code and reset password" : "Send Gmail reset code" : mode === "login" ? "Sign in to admin dashboard" : "Submit for approval"}<ArrowRight size={17} /></button></form>}
    {resetMode && resetSent && <button className="ha-forgot-link" onClick={sendResetCode} disabled={busy}>Send another code</button>}
    <div className="ha-auth-links">{resetMode ? <button onClick={() => { setResetMode(false); setResetSent(false); setResetComplete(false); setNotice(""); setError(""); }}>Back to admin login</button> : mode === "login" ? <><span>Need an admin account?</span><Link to="/hospital-admin/register">Register and request approval</Link></> : <><span>Already approved?</span><Link to="/hospital-admin/login">Sign in <ArrowRight size={14} /></Link></>}</div><Link className="ha-back" to="/login"><ArrowLeft size={15} /> Hospital staff login</Link>
  </section></main>;
}

export default HospitalAdminPortal;
