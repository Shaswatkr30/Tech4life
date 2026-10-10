import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock3, ExternalLink, FileVideo2, Image as ImageIcon, MapPin, Phone, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function EmergencyReviewQueue({ token }) {
  const [items, setItems] = useState([]);
  const [proofUrls, setProofUrls] = useState({});
  const proofUrlsRef = useRef([]);
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function loadQueue() {
    setError("");
    try {
      const response = await fetch(`${API}/api/emergencies/admin/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to load emergency reports.");
      setItems(data);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { loadQueue(); return () => proofUrlsRef.current.forEach(item => URL.revokeObjectURL(item.url)); }, []);

  async function showProofs(item) {
    if (expandedId === item.id) { setExpandedId(null); return; }
    setExpandedId(item.id);
    if (proofUrls[item.id]) return;
    try {
      const urls = await Promise.all(item.proofs.map(async proof => {
        const response = await fetch(`${API}/api/emergencies/admin/${item.id}/proofs/${proof.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Could not open proof file.");
        return { ...proof, url: URL.createObjectURL(await response.blob()) };
      }));
      proofUrlsRef.current.push(...urls);
      setProofUrls(previous => ({ ...previous, [item.id]: urls }));
    } catch (err) { setError(err.message); }
  }

  async function review(item, status) {
    setBusyId(item.id); setError("");
    try {
      const response = await fetch(`${API}/api/emergencies/admin/${item.id}/status`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status, review_note: notes[item.id] || "" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to update emergency report.");
      setItems(previous => previous.map(entry => entry.id === item.id ? { ...entry, status: data.status, review_note: notes[item.id] || "" } : entry));
    } catch (err) { setError(err.message); } finally { setBusyId(null); }
  }

  return <section className="emergency-review-queue"><header><div><span>EMERGENCY SAFETY REVIEW</span><h2>Emergency reports and proof</h2><p>Check the submitted photo/video and report details before sharing a report with people within 10 km.</p></div><button onClick={loadQueue} aria-label="Refresh emergency reports"><RefreshCw size={16} /></button></header>
    {error && <div className="emergency-review-error" role="alert">{error}</div>}
    {items.length === 0 ? <div className="emergency-review-empty"><ShieldCheck size={19} />No emergency reports submitted.</div> : <div className="emergency-review-list">{items.map(item => <article key={item.id} className="emergency-review-item"><div className="emergency-review-main"><div className="emergency-review-mark"><AlertTriangle size={18} /></div><div className="emergency-review-details"><strong>{item.requester_name} · #{item.id}</strong><span>{item.description}</span><small><Phone size={12} />{item.phone} <MapPin size={12} />{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)} <Clock3 size={12} />{new Date(item.created_at).toLocaleString("en-IN")}</small></div><span className={`emergency-review-status ${item.status}`}>{item.status === "verified" ? "Verified" : item.status === "rejected" ? "Rejected" : "Pending review"}</span></div>
      <div className="emergency-review-controls"><button className="emergency-proof-button" onClick={() => showProofs(item)}>{item.proofs.length} proof file{item.proofs.length !== 1 ? "s" : ""}<ChevronDown size={14} /></button><a href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=16/${item.latitude}/${item.longitude}`} target="_blank" rel="noreferrer">Open location <ExternalLink size={13} /></a></div>
      {expandedId === item.id && <div className="emergency-proof-preview">{proofUrls[item.id]?.map(proof => <figure key={proof.id}>{proof.mime_type.startsWith("video/") ? <video src={proof.url} controls preload="metadata" /> : <img src={proof.url} alt={`Emergency proof from ${item.requester_name}`} />}<figcaption>{proof.mime_type.startsWith("video/") ? <FileVideo2 size={13} /> : <ImageIcon size={13} />}{proof.name} · {(proof.size_bytes / (1024 * 1024)).toFixed(1)} MB</figcaption></figure>)}{!proofUrls[item.id] && <span>Loading protected proof files…</span>}</div>}
      {item.status === "pending" && <div className="emergency-review-decision"><input aria-label="Review note" placeholder="Review note (optional)" value={notes[item.id] || ""} onChange={e => setNotes(previous => ({ ...previous, [item.id]: e.target.value }))} /><button className="review-approve" disabled={busyId === item.id} onClick={() => review(item, "verified")}><CheckCircle2 size={15} />Verify report</button><button className="review-reject" disabled={busyId === item.id} onClick={() => review(item, "rejected")}><XCircle size={15} />Reject</button></div>}</article>)}</div>}
  </section>;
}
