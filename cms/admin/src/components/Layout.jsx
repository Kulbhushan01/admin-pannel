import { useState, useEffect } from "react";
import { api } from "../utils/api.js";
import logoImg from "../assets/logo.jpeg";

const NAV = [
  { group: "Main" },
  { id:"dashboard", label:"Dashboard",  icon:"📊" },
  { id:"articles",  label:"Articles",   icon:"📰", badge:true },
  { group: "Content" },
  { id:"new",       label:"Add New",    icon:"✏️" },
  { group: "Settings" },
  { id:"settings",  label:"Settings",   icon:"⚙️" },
  { id:"users",     label:"Users",      icon:"👥" },
];

export default function Layout({ user, page, navigate, onLogout, children }) {
  const [clock,    setClock]    = useState(new Date());
  const [stats,    setStats]    = useState({ published: null, draft: null });
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.getStats()
      .then(s => setStats({ published: s.published, draft: s.draft }))
      .catch(() => {});
  }, [page]);

  function navTo(id) {
    navigate(id);
    setSideOpen(false);
  }

  const timeStr = clock.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  return (
    <div className="cms-wrap">

      {/* ══════════════════ TOPBAR ══════════════════ */}
      <header className="cms-topbar">

        {/* Left: hamburger (mobile only) + logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
          <button
            className="ham-btn"
            onClick={() => setSideOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {sideOpen ? "✕" : "☰"}
          </button>

          <div
            onClick={() => navTo("dashboard")}
            style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", flexShrink:0 }}
          >
            <div style={{
              background:"#fff", borderRadius:6, padding:"3px 8px",
              display:"flex", alignItems:"center", flexShrink:0,
            }}>
              <img
                src={logoImg}
                alt="Maharashtra Update"
                style={{ height:30, width:"auto", display:"block", objectFit:"contain" }}
              />
            </div>
            <div style={{ lineHeight:1 }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#fff", letterSpacing:.5 }}>
                MU <span style={{ color:"var(--brand)" }}>CMS</span>
              </div>
              <div style={{ fontSize:9, color:"var(--slate)", textTransform:"uppercase", letterSpacing:1.5, marginTop:2 }}>
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        {/* Center: clock */}
        <div className="topbar-clock-area">
          <span style={{ fontSize:11, color:"var(--sl2)" }}>🕐</span>
          <span style={{
            fontSize:12, fontWeight:700, color:"var(--sl3)",
            fontVariantNumeric:"tabular-nums", letterSpacing:.5,
          }}>
            {timeStr}
          </span>
        </div>

        {/* Right: user info + logout */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, justifyContent:"flex-end" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <div style={{
              width:30, height:30, borderRadius:"50%",
              background:"var(--navy-3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:800, color:"var(--brand)", flexShrink:0,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ lineHeight:1 }} className="topbar-user-name">
              <div style={{ fontSize:12, fontWeight:700, color:"#fff", whiteSpace:"nowrap", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis" }}>
                {user.name}
              </div>
              <div style={{ fontSize:9, color:"var(--slate)", textTransform:"uppercase", letterSpacing:.8, marginTop:2 }}>
                {user.role}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)",
              color:"var(--sl2)", cursor:"pointer", padding:"6px 12px", borderRadius:6,
              fontSize:12, fontWeight:600, whiteSpace:"nowrap",
              transition:"all .15s", fontFamily:"var(--font-en)",
              display:"flex", alignItems:"center", gap:5,
            }}
            onMouseOver={e => { e.currentTarget.style.background="rgba(239,68,68,.15)"; e.currentTarget.style.color="#ef4444"; }}
            onMouseOut={e => { e.currentTarget.style.background="rgba(255,255,255,.06)"; e.currentTarget.style.color="var(--sl2)"; }}
          >
            <span>↩</span>
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </header>

      {/* Mobile overlay — clicking it closes sidebar */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{
            position:"fixed", inset:0, top:52,
            background:"rgba(0,0,0,.5)",
            zIndex:250,
          }}
        />
      )}

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside className={`cms-sidebar${sideOpen ? " sidebar-open" : ""}`}>
        <div style={{ padding:"8px 6px" }}>
          {NAV.map((item, i) => {
            if (item.group) return (
              <div key={i} className="nav-section-title">{item.group}</div>
            );
            return (
              <button
                key={item.id}
                className={`nav-item${page === item.id ? " active" : ""}`}
                onClick={() => navTo(item.id)}
              >
                <span className="ni">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">●</span>}
              </button>
            );
          })}
        </div>

        {/* Quick stats box */}
        <div style={{
          margin:"12px 10px 0",
          padding:"12px 14px",
          background:"rgba(255,255,255,.04)",
          borderRadius:"var(--r2)",
          border:"1px solid rgba(255,255,255,.06)",
        }}>
          <div style={{
            fontSize:9, color:"var(--slate)", letterSpacing:1.5,
            textTransform:"uppercase", marginBottom:8, fontWeight:700,
          }}>
            Quick Stats
          </div>
          <div style={{ fontSize:12, color:"var(--sl2)", lineHeight:2 }}>
            <div>
              ✅ Published:{" "}
              <strong style={{ color:"var(--green)" }}>
                {stats.published !== null ? stats.published : "…"}
              </strong>
            </div>
            <div>
              📝 Drafts:{" "}
              <strong style={{ color:"var(--brand)" }}>
                {stats.draft !== null ? stats.draft : "…"}
              </strong>
            </div>
          </div>
          <div style={{ marginTop:10, fontSize:10, color:"var(--navy-3)", lineHeight:1.8 }}>
            Maharashtra Update CMS<br />v1.1 · 2026
          </div>
        </div>
      </aside>

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <main className="cms-content">
        {children}
      </main>

    </div>
  );
}
