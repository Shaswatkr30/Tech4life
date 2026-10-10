import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetNotice, setResetNotice] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Invalid admin credentials"
        );
      }

      localStorage.setItem(
        "tech4life_admin_token",
        data.access_token
      );

      navigate("/admin/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendResetOtp = async () => {
    setError(""); setResetNotice(""); setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_type: "admin", identifier: username }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to send reset code.");
      setResetSent(true); setResetNotice(data.message || "A code was sent to the recovery email linked to this admin account.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const resetAdminPassword = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_type: "admin", identifier: username, otp: resetOtp, password: newPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to reset password.");
      setResetComplete(true); setResetNotice(data.message || "Password changed. Sign in with your new password.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleRecoverySubmit = (e) => {
    if (!resetSent) { e.preventDefault(); sendResetOtp(); return; }
    resetAdminPassword(e);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-icon">
          🛡️
        </div>

        <h1>Tech4Life Admin</h1>

        <p>{resetMode ? "A six-digit Gmail code protects the admin password reset." : "Secure Administration Portal"}</p>

        {resetNotice && <div className="admin-error admin-success" role="status">{resetNotice}</div>}
        {resetComplete ? null : <form onSubmit={resetMode ? handleRecoverySubmit : handleLogin}>

          <label>{resetMode ? "Admin username (recovery email on file)" : "Username"}</label>

          <input
            type="text"
            placeholder="Enter admin username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          {!resetMode && <><label>Password</label>

          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          </>}

          {resetMode && resetSent && <><label>Six-digit email code</label><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g, ""))} required /><label>New password</label><input type="password" minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" /></>}

          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          {!resetMode && <button type="button" className="admin-forgot-link" onClick={() => { setResetMode(true); setResetSent(false); setResetComplete(false); setResetNotice(""); setError(""); }}>Forgot password? Send Gmail OTP</button>}
          <button
            type="submit"
            disabled={loading}
            className="admin-login-button"
          >
            {loading ? "Please wait..." : resetMode ? resetSent ? "Verify code and reset password" : "Send Gmail OTP" : "Admin Login"}
          </button>

        </form>}

        {resetMode && <button type="button" className="admin-forgot-link" onClick={() => { setResetMode(false); setResetSent(false); setResetComplete(false); setResetNotice(""); setError(""); }}>Back to admin login</button>}

        <button
          className="admin-back-button"
          onClick={() => navigate("/")}
        >
          ← Back to Website
        </button>

      </div>
    </div>
  );
}

export default AdminLogin;
