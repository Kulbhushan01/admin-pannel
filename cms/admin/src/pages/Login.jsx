import { useState } from "react";
import { api } from "../utils/api.js";
import logoImg from "../assets/logo.jpeg";

const USERS = [
  { role: "Admin",    dot: "#ef4444", em: "admin@mu.in",  pw: "admin123" },
  { role: "Editor",   dot: "#f59e0b", em: "amruta@mu.in", pw: "pass123"  },
  { role: "Reporter", dot: "#22c55e", em: "demo@mu.in",   pw: "demo123"  },
];

export default function Login({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [err,      setErr]      = useState("");
  const [busy,     setBusy]     = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const emailVal = email.trim();
    const passVal  = pass;

    if (!emailVal || !passVal) {
      setErr("Email आणि Password टाका");
      return;
    }

    setBusy(true);
    setErr("");

    try {
      const { token, user } = await api.login(emailVal, passVal);
      localStorage.setItem("mu_token", token);
      onLogin(user);
    } catch (e) {
      // Show the exact server error message so user knows what went wrong
      const msg = e.message || "Login failed";
      if (msg.includes("Invalid") || msg.includes("credentials") || msg.includes("password")) {
        setErr("चुकीचा Email किंवा Password. खाली credentials तपासा.");
      } else if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
        setErr("❌ Server शी connection होत नाही. Backend (port 5000) सुरू आहे का?");
      } else {
        setErr(`Error: ${msg}`);
      }
    }

    setBusy(false);
  }

  // Fill fields only — user must click Login themselves
  function fillOnly(em, pw) {
    setEmail(em);
    setPass(pw);
    setErr("");
  }

  // Reset the database to defaults (fixes stale password hashes)
  async function resetDB() {
    setResetting(true);
    setErr("");
    try {
      const res = await fetch("http://localhost:5000/api/dev/reset-db", { method: "POST" });
      if (res.ok) {
        setErr(""); 
        alert("✅ DB reset! Default credentials restored. Now try logging in.");
      } else {
        setErr("Reset failed — is the backend running on port 5000?");
      }
    } catch {
      setErr("❌ Cannot reach backend. Start: cd cms/backend && npm start");
    }
    setResetting(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      padding: 16,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Dot grid background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)",
        backgroundSize: "28px 28px", opacity: 0.15,
      }} />

      <div style={{
        background: "#fff", borderRadius: 16,
        padding: "36px 32px 28px",
        width: "100%", maxWidth: 400,
        boxShadow: "0 25px 60px rgba(0,0,0,.5)",
        position: "relative", zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            display: "inline-flex", background: "#f8fafc",
            borderRadius: 10, padding: "10px 20px",
            border: "1px solid #e2e8f0", marginBottom: 14,
          }}>
            <img src={logoImg} alt="Maharashtra Update"
              style={{ height: 52, width: "auto", display: "block", objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 3, textTransform: "uppercase" }}>
            CMS Admin Panel
          </div>
        </div>

        {/* Error box */}
        {err && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            fontSize: 13, color: "#b91c1c",
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span>{err}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={submit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: "block", fontSize: 11, fontWeight: 700,
              color: "#64748b", textTransform: "uppercase", letterSpacing: .8, marginBottom: 6,
            }}>Email</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="username"
              style={{
                width: "100%", padding: "10px 12px",
                border: "1.5px solid #e2e8f0", borderRadius: 8,
                fontSize: 14, color: "#0f172a", outline: "none",
                fontFamily: "'Inter', sans-serif",
                transition: "border-color .2s",
                boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "#0f172a"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 22 }}>
            <label style={{
              display: "block", fontSize: 11, fontWeight: 700,
              color: "#64748b", textTransform: "uppercase", letterSpacing: .8, marginBottom: 6,
            }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "10px 42px 10px 12px",
                  border: "1.5px solid #e2e8f0", borderRadius: 8,
                  fontSize: 14, color: "#0f172a", outline: "none",
                  fontFamily: "'Inter', sans-serif",
                  transition: "border-color .2s",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#0f172a"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", fontSize: 16, padding: 0, lineHeight: 1,
                }}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%", padding: "12px 20px",
              background: busy ? "#94a3b8" : "#0f172a",
              color: "#fff", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "background .2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {busy ? "⏳ Logging in…" : "🔓 Login"}
          </button>
        </form>

        {/* Quick-fill credentials — click fills fields, must still press Login */}
        <div style={{
          marginTop: 20, padding: "14px 14px 8px",
          background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            🔑 Quick Fill
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#b8c2cc", fontSize: 10 }}>
              — click to fill, then press Login
            </span>
          </div>

          {USERS.map(({ role, dot, em, pw }) => (
            <button
              key={role}
              type="button"
              onClick={() => fillOnly(em, pw)}
              style={{
                width: "100%", background: "none", border: "1px solid #e2e8f0",
                borderRadius: 7, padding: "8px 12px", marginBottom: 6,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                fontFamily: "'Inter', sans-serif", textAlign: "left",
                transition: "background .12s, border-color .12s",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
              onMouseOut={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", minWidth: 64 }}>{role}</span>
              <span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>{em}</span>
              <span style={{ fontSize: 10, color: "#cbd5e1" }}>→</span>
            </button>
          ))}

          {/* Reset DB — fixes stale password hash issues */}
          <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 10 }}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6 }}>
              Login काम करत नाही? DB reset करा:
            </div>
            <button
              type="button"
              onClick={resetDB}
              disabled={resetting}
              style={{
                width: "100%", background: "none",
                border: "1px dashed #fca5a5", borderRadius: 7,
                padding: "7px 12px", cursor: resetting ? "not-allowed" : "pointer",
                fontSize: 11, color: "#ef4444", fontFamily: "'Inter', sans-serif",
                transition: "background .12s",
              }}
              onMouseOver={e => !resetting && (e.currentTarget.style.background = "#fef2f2")}
              onMouseOut={e => e.currentTarget.style.background = "none"}
            >
              {resetting ? "⏳ Resetting…" : "🔄 Reset DB to defaults"}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
