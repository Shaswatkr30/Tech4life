import { useEffect, useState } from "react";
import { Mail, Save, ShieldCheck } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function AdminRecoverySettings({ token }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch(`${API}/api/admin/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.json()).then(data => { if (data.email) setEmail(data.email); }).catch(() => {});
  }, [token]);
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${API}/api/admin/recovery-email`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to save recovery email.");
      setMessage(data.message);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="admin-recovery-settings"><div><span><ShieldCheck size={15} /> ACCOUNT RECOVERY</span><strong>Gmail OTP destination</strong><small>Set the recovery email for the system administrator account.</small></div><form onSubmit={save}><label><Mail size={15} /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" /></label><button disabled={busy}><Save size={14} />{busy ? "Saving…" : "Save email"}</button></form>{error && <p className="admin-recovery-error" role="alert">{error}</p>}{message && <p className="admin-recovery-success" role="status">{message}</p>}</section>;
}
