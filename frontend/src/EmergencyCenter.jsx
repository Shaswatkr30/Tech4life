import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, LocateFixed, MapPin, Navigation, Phone, ShieldCheck, Upload, X } from "lucide-react";
import "./EmergencyCenter.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const DEFAULT_CENTER = [30.33603, 77.870868];

function getNetworkErrorMessage(error, action) {
  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return `Could not connect to the server while ${action}. Check that the backend is running at ${API}, then restart it so the latest CORS settings take effect.`;
  }
  return error.message || `Unable to complete this request while ${action}.`;
}

function LocateMap({ location, points }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView([location.latitude, location.longitude], 13, { animate: true });
    else if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [35, 35], maxZoom: 12 });
  }, [location, points, map]);
  return null;
}

function marker(color) {
  return L.divIcon({ className: "emergency-map-marker", html: `<span style="--marker-color:${color}"><i></i></span>`, iconSize: [30, 36], iconAnchor: [15, 32] });
}

function EmergencyMap({ location, hospitals, incidents }) {
  const points = useMemo(() => [...hospitals, ...incidents].map(item => [item.latitude, item.longitude]), [hospitals, incidents]);
  return <div className="emergency-map"><MapContainer center={location ? [location.latitude, location.longitude] : DEFAULT_CENTER} zoom={12} scrollWheelZoom>
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <LocateMap location={location} points={points} />
    {location && <><Circle center={[location.latitude, location.longitude]} radius={10000} pathOptions={{ color: "#39d7ae", fillColor: "#39d7ae", fillOpacity: .07, weight: 2, dashArray: "7 7" }} /><Marker position={[location.latitude, location.longitude]} icon={marker("#41d7a5")}><Popup>Your current location</Popup></Marker></>}
    {hospitals.map(hospital => <Marker key={`hospital-${hospital.id}`} position={[hospital.latitude, hospital.longitude]} icon={marker("#4ba7ff")}><Popup><strong>{hospital.name}</strong><br />{hospital.distance_km} km away<br />{hospital.address}{hospital.phone && <><br /><a href={`tel:${hospital.phone}`}>Call {hospital.phone}</a></>}</Popup></Marker>)}
    {incidents.map(incident => <Marker key={`incident-${incident.id}`} position={[incident.latitude, incident.longitude]} icon={marker("#ff6d68")}><Popup><strong>Verified emergency #{incident.id}</strong><br />{incident.description}<br />{incident.distance_km} km away</Popup></Marker>)}
  </MapContainer></div>;
}

function useCurrentLocation() {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  function locate() {
    if (!navigator.geolocation) { setLocationError("This browser cannot provide GPS location. Enter coordinates manually."); return; }
    setLocating(true); setLocationError("");
    navigator.geolocation.getCurrentPosition(
      position => { setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy_m: position.coords.accuracy, manual: false }); setLocating(false); },
      () => { setLocationError("Location permission was unavailable. Enter your coordinates manually."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }
  useEffect(() => { locate(); }, []);
  return { location, setLocation, locationError, locating, locate };
}

export function EmergencyDashboard() {
  const { location, setLocation, locationError, locating, locate } = useCurrentLocation();
  const [coordinates, setCoordinates] = useState({ latitude: "", longitude: "" });
  const [data, setData] = useState({ hospitals: [], emergencies: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!location) return;
    setCoordinates({ latitude: location.latitude.toFixed(6), longitude: location.longitude.toFixed(6) });
    setLoading(true); setError("");
    fetch(`${API}/api/emergencies/nearby?latitude=${location.latitude}&longitude=${location.longitude}`)
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.detail || "Could not load nearby information."); return result; })
      .then(setData).catch(err => setError(getNetworkErrorMessage(err, "loading nearby emergency information"))).finally(() => setLoading(false));
  }, [location, refreshKey]);

  function applyCoordinates(event) {
    event.preventDefault();
    const latitude = Number(coordinates.latitude); const longitude = Number(coordinates.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) { setError("Enter valid latitude and longitude values."); return; }
    setLocation({ latitude, longitude, manual: true, accuracy_m: null });
  }

  return <main className="emergency-page"><header className="emergency-hero"><div><span className="emergency-eyebrow"><AlertTriangle size={15} /> 10 KM EMERGENCY NETWORK</span><h1>Nearby help,<br /><em>when it matters.</em></h1><p>Live map of approved hospitals and emergencies accepted by nearby hospital admins.</p></div><Link className="emergency-report-button" to="/emergency/report"><AlertTriangle size={17} /> Report an emergency <ArrowRight size={16} /></Link></header>
    <div className="emergency-location-bar"><div><LocateFixed size={17} /><span>{location ? `Your location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : locationError || "Finding your GPS location…"}</span></div><button onClick={locate} disabled={locating}>{locating ? "Locating…" : "Use current location"}</button><button onClick={() => setRefreshKey(value => value + 1)} disabled={!location || loading}>{loading ? "Refreshing…" : "Refresh nearby"}</button><form onSubmit={applyCoordinates}><input aria-label="Latitude" placeholder="Latitude" value={coordinates.latitude} onChange={e => setCoordinates({ ...coordinates, latitude: e.target.value })} /><input aria-label="Longitude" placeholder="Longitude" value={coordinates.longitude} onChange={e => setCoordinates({ ...coordinates, longitude: e.target.value })} /><button>Set location</button></form></div>
    {error && <div className="emergency-notice error" role="alert">{error}</div>}
    <div className="emergency-map-layout"><section className="emergency-map-card"><div className="emergency-section-heading"><div><span>LIVE LOCATION MAP</span><h2>Hospitals and verified emergencies</h2></div><span className="emergency-radius"><i /> 10 km radius</span></div><EmergencyMap location={location} hospitals={data.hospitals} incidents={data.emergencies} />{!location && <div className="emergency-map-overlay"><strong>Location needed to search nearby</strong><span>Allow GPS or enter coordinates above.</span></div>}</section>
      <aside className="emergency-nearby"><div className="emergency-count-grid"><div><strong>{data.hospitals.length}</strong><span>Verified hospitals</span></div><div><strong>{data.emergencies.length}</strong><span>Hospital-accepted emergencies</span></div></div><section><div className="emergency-section-heading compact"><div><span>WITHIN 10 KM</span><h2>Nearby hospitals</h2></div></div>{loading ? <p className="emergency-empty">Loading nearby services…</p> : data.hospitals.length === 0 ? <p className="emergency-empty">No verified hospital coordinates found in this radius.</p> : <div className="emergency-nearby-list">{data.hospitals.map(hospital => <article key={hospital.id}><div className="emergency-hospital-icon"><MapPin size={17} /></div><div><strong>{hospital.name}</strong><small>{hospital.distance_km} km · {hospital.city}</small>{hospital.phone && <a href={`tel:${hospital.phone}`}><Phone size={13} />{hospital.phone}</a>}</div></article>)}</div>}</section>
        <section><div className="emergency-section-heading compact"><div><span>HOSPITAL ACCEPTED</span><h2>Nearby emergencies</h2></div></div>{data.emergencies.length === 0 ? <p className="emergency-empty">No hospital-accepted emergency reports within 10 km.</p> : <div className="emergency-nearby-list">{data.emergencies.map(item => <article key={item.id}><div className="emergency-alert-icon"><AlertTriangle size={16} /></div><div><strong>Emergency #{item.id}</strong><small>{item.distance_km} km · {new Date(item.created_at).toLocaleString("en-IN")}</small><p>{item.description}</p></div></article>)}</div>}</section>
      </aside></div><footer className="emergency-trust"><ShieldCheck size={16} /> Reports are sent directly to active hospital admins within 10 km. Only an emergency accepted by a hospital appears on this map.</footer>
  </main>;
}

export function EmergencyReport() {
  const { location, locationError, locating, locate } = useCurrentLocation();
  const [form, setForm] = useState({ requester_name: "", phone: "", description: "" });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError(""); setNotice("");
    if (!files.length) { setError("Upload at least one current photo or video as proof."); return; }
    if (!location || location.manual) { setError("A live GPS location is required to submit an emergency report. Enable location access and try again."); return; }
    if (!location.accuracy_m || location.accuracy_m > 2000) { setError("GPS accuracy is too low. Move to a clearer location and refresh GPS; accuracy must be within 2 km."); return; }
    const body = new FormData();
    body.append("requester_name", form.requester_name); body.append("phone", form.phone); body.append("description", form.description); body.append("latitude", String(location.latitude)); body.append("longitude", String(location.longitude)); body.append("location_accuracy_m", String(location.accuracy_m));
    files.forEach(file => body.append("proofs", file));
    setBusy(true);
    try { const response = await fetch(`${API}/api/emergencies/`, { method: "POST", body }); const result = await response.json(); if (!response.ok) throw new Error(result.detail || "Could not submit emergency report."); setNotice(result.message); setForm({ requester_name: "", phone: "", description: "" }); setFiles([]); }
    catch (err) { setError(getNetworkErrorMessage(err, "submitting your emergency report")); } finally { setBusy(false); }
  }

  return <main className="emergency-report-page"><header className="emergency-report-heading"><Link to="/emergency/dashboard"><ArrowRight className="back-arrow" size={15} /> Back to emergency map</Link><span className="emergency-eyebrow"><AlertTriangle size={15} /> EMERGENCY REPORT</span><h1>Request urgent help</h1><p>Share your location and current proof. Your report is reviewed before it is shared with people nearby.</p></header>
    <div className="emergency-safety-note"><ShieldCheck size={19} /><span><strong>Proof required for every report.</strong> Upload a photo or video from the emergency. Your report is sent directly to active hospital admins within 10 km. For immediate danger, call your local emergency service.</span></div>
    {error && <div className="emergency-notice error" role="alert">{error}</div>}{notice && <div className="emergency-notice success" role="status"><CheckCircle2 size={18} />{notice}<Link to="/emergency/dashboard">Open emergency dashboard</Link></div>}
    <form className="emergency-form" onSubmit={submit}><label>Your name<input required minLength={2} maxLength={160} value={form.requester_name} onChange={e => setForm({ ...form, requester_name: e.target.value })} placeholder="Name of person requesting help" /></label><label>Contact phone<input required minLength={7} maxLength={30} type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone responders can reach" /></label><label className="emergency-description">What is happening?<textarea required minLength={10} maxLength={2000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe the critical situation and help needed" /></label>
      <section className="emergency-location-input"><div className="emergency-section-heading compact"><div><span>YOUR REAL LOCATION</span><h2>Live GPS required</h2></div><button type="button" onClick={locate} disabled={locating}><LocateFixed size={15} />{locating ? "Locating…" : "Refresh GPS"}</button></div><p>{location && !location.manual ? `GPS captured · accuracy ${Math.round(location.accuracy_m)} m` : locationError || "Allow GPS location access; emergency reports cannot use manually entered coordinates."}</p><div className="emergency-coordinate-fields"><label>Latitude<input readOnly value={location && !location.manual ? location.latitude.toFixed(6) : ""} /></label><label>Longitude<input readOnly value={location && !location.manual ? location.longitude.toFixed(6) : ""} /></label></div></section>
      <label className="emergency-proof-upload"><span><Upload size={19} /><strong>Photo / video proof</strong><small>1–4 files · JPG, PNG, WebP, MP4, WebM or MOV · up to 25 MB each</small></span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple required onChange={e => setFiles(Array.from(e.target.files || []).slice(0, 4))} /></label>{files.length > 0 && <div className="emergency-file-list">{files.map(file => <span key={`${file.name}-${file.lastModified}`}>{file.type.startsWith("video/") ? "Video" : "Photo"} · {file.name}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(files.filter(item => item !== file))}><X size={14} /></button></span>)}</div>}
      <button className="emergency-submit" disabled={busy}>{busy ? "Sending to nearby hospitals…" : "Send emergency to nearby hospitals"}<ArrowRight size={17} /></button><p className="emergency-private-note"><Clock3 size={14} />Nearby hospital admins receive your report and proof directly; call emergency services if no hospital is available.</p>
    </form>
  </main>;
}
