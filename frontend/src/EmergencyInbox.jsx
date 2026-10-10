import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, FileVideo2, Image as ImageIcon, MapPin, Phone, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import "./EmergencyInbox.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function EmergencyInbox({ token }) {
  const [items, setItems] = useState([]);
  const [proofUrls, setProofUrls] = useState({});
  const proofUrlsRef = useRef([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadInbox() {
    try {
      const response = await fetch(`${API}/api/emergencies/hospital/inbox`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to load nearby emergency alerts.");
      setItems(data);
      setError("");
    } catch (err) {
      setError(err instanceof TypeError ? "Could not connect to the emergency server. Check your connection and refresh." : err.message);
    }
  }

  useEffect(() => {
    loadInbox();
    const timer = window.setInterval(loadInbox, 15000);
    return () => {
      window.clearInterval(timer);
      proofUrlsRef.current.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, [token]);

  async function openProofs(item) {
    if (proofUrls[item.id]) return;
    setError("");
    try {
      const urls = await Promise.all(item.proofs.map(async proof => {
        const response = await fetch(`${API}/api/emergencies/hospital/${item.id}/proofs/${proof.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Could not open the emergency proof file.");
        return { ...proof, url: URL.createObjectURL(await response.blob()) };
      }));
      proofUrlsRef.current.push(...urls);
      setProofUrls(previous => ({ ...previous, [item.id]: urls }));
    } catch (err) { setError(err.message); }
  }

  async function respond(item, decision) {
    setBusyId(item.id); setError(""); setNotice("");
    try {
      const response = await fetch(`${API}/api/emergencies/hospital/${item.id}/response`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, note: "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to update this emergency alert.");
      setNotice(decision === "accepted" ? "Emergency accepted. Other nearby hospitals have been notified that help is covered." : "Your hospital declined this alert. It remains open for other nearby hospitals.");
      await loadInbox();
    } catch (err) { setError(err instanceof TypeError ? "Could not connect to the emergency server. Check your connection and try again." : err.message); }
    finally { setBusyId(null); }
  }

  const pendingCount = items.filter(item => item.dispatch_status === "pending").length;

  return <section className="emergency-inbox">
    <header className="emergency-inbox-heading"><div><span><ShieldCheck size={14} /> 10 KM HOSPITAL ALERTS</span><h2>Nearby emergency requests</h2><p>New alerts assigned to your hospital appear here and refresh automatically every 15 seconds. Review the proof and contact the person directly.</p></div><button type="button" onClick={loadInbox} aria-label="Refresh emergency inbox"><RefreshCw size={16} /></button></header>
    <div className="emergency-inbox-summary"><strong>{pendingCount}</strong><span>awaiting your response</span><span>·</span><span>{items.length} total alerts</span></div>
    {error && <div className="emergency-inbox-alert error" role="alert">{error}</div>}
    {notice && <div className="emergency-inbox-alert success" role="status"><CheckCircle2 size={16} />{notice}</div>}
    {items.length === 0 ? <div className="emergency-inbox-empty"><ShieldCheck size={19} />No emergency requests assigned within 10 km.</div> : <div className="emergency-inbox-list">{items.map(item => <article className="emergency-inbox-item" key={item.id}>
      <div className="emergency-inbox-main"><div className="emergency-inbox-icon"><AlertTriangle size={18} /></div><div className="emergency-inbox-details"><strong>{item.requester_name} · Emergency #{item.id}</strong><p>{item.description}</p><small><Phone size={12} /> <a href={`tel:${item.phone}`}>{item.phone}</a><MapPin size={12} /> {item.distance_km} km away · {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}<Clock3 size={12} /> {new Date(item.created_at).toLocaleString("en-IN")}</small></div><span className={`emergency-inbox-status ${item.dispatch_status}`}>{item.dispatch_status === "pending" ? "Needs response" : item.dispatch_status === "accepted" ? "Accepted by your hospital" : item.dispatch_status === "cancelled" ? "Covered by another hospital" : "Declined by your hospital"}</span></div>
      <div className="emergency-inbox-actions"><button type="button" onClick={() => openProofs(item)}><ImageIcon size={14} /> View {item.proofs.length} proof file{item.proofs.length === 1 ? "" : "s"}</button><a href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=16/${item.latitude}/${item.longitude}`} target="_blank" rel="noreferrer"><MapPin size={14} /> Open live location <ExternalLink size={12} /></a></div>
      {proofUrls[item.id] && <div className="emergency-inbox-proofs">{proofUrls[item.id].map(proof => <figure key={proof.id}>{proof.mime_type.startsWith("video/") ? <video src={proof.url} controls preload="metadata" /> : <img src={proof.url} alt={`Emergency proof from ${item.requester_name}`} />}<figcaption>{proof.mime_type.startsWith("video/") ? <FileVideo2 size={13} /> : <ImageIcon size={13} />}{proof.name} · {(proof.size_bytes / (1024 * 1024)).toFixed(1)} MB</figcaption></figure>)}</div>}
      {item.dispatch_status === "pending" && <div className="emergency-inbox-response"><button type="button" className="accept" disabled={busyId === item.id} onClick={() => respond(item, "accepted")}><CheckCircle2 size={15} /> {busyId === item.id ? "Saving…" : "Accept and respond"}</button><button type="button" className="decline" disabled={busyId === item.id} onClick={() => respond(item, "rejected")}><XCircle size={15} /> Cannot respond</button></div>}
    </article>)}</div>}
  </section>;
}
