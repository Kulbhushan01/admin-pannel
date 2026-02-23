import { useState, useEffect } from "react";
import { api } from "../utils/api.js";

export default function Dashboard({ navigate, showToast }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(s => { setStats(s); setLoading(false); })
      .catch(() => { showToast("Failed to load stats", "error"); setLoading(false); });
  }, []);

  function statusBadge(s) {
    const map = { published:"bdg-green", draft:"bdg-yellow", archived:"bdg-slate" };
    return <span className={`bdg ${map[s] || "bdg-slate"}`}>● {s}</span>;
  }

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
      <div style={{ textAlign:"center", color:"#94a3b8" }}>
        <div style={{ fontSize:36, marginBottom:10 }}>⏳</div>
        <div style={{ fontWeight:600 }}>Loading dashboard…</div>
      </div>
    </div>
  );

  const STAT_CARDS = stats ? [
    { label:"Total Articles", value: stats.total,                      icon:"📰", color:"#3b82f6" },
    { label:"Published",      value: stats.published,                   icon:"✅", color:"#22c55e" },
    { label:"Drafts",         value: stats.draft,                       icon:"📝", color:"#f59e0b" },
    { label:"Breaking",       value: stats.breaking,                    icon:"🔴", color:"#ef4444" },
    { label:"Total Views",    value: stats.totalViews?.toLocaleString(), icon:"👁", color:"#8b5cf6" },
  ] : [];

  return (
    <div className="fade-up">

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:"#0f172a" }}>Dashboard</h1>
          <p style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
            {new Date().toLocaleDateString("mr-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </p>
        </div>
        <button className="btn btn-brand" onClick={() => navigate("new")}>✏️ Add New Article</button>
      </div>

      {/* Stat cards — responsive grid via CSS class */}
      <div className="stat-grid">
        {STAT_CARDS.map(c => (
          <div key={c.label} className="stat">
            <span className="stat-icon">{c.icon}</span>
            <div className="stat-v" style={{ color: c.color }}>{c.value ?? "—"}</div>
            <div className="stat-l">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom two-col grid — stacks on mobile */}
      <div className="dash-grid">

        {/* Recent articles */}
        <div className="card" style={{ marginBottom:0 }}>
          <div className="card-h">📋 Recent Articles</div>

          {/* Desktop table */}
          <div className="tbl-wrap dash-desktop-tbl">
            <table>
              <thead>
                <tr>
                  <th>Headline</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent || []).map(a => (
                  <tr key={a.id} onClick={() => navigate("edit", a.id)} style={{ cursor:"pointer" }}>
                    <td>
                      <div style={{ fontFamily:"'Noto Sans Devanagari',sans-serif", fontSize:13, fontWeight:600, maxWidth:240, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {a.headline}
                      </div>
                    </td>
                    <td><span className="bdg bdg-blue">{a.category}</span></td>
                    <td>{statusBadge(a.status)}</td>
                    <td style={{ fontSize:12, color:"#64748b" }}>{a.byline || "—"}</td>
                    <td style={{ fontSize:11, color:"#94a3b8", whiteSpace:"nowrap" }}>
                      {new Date(a.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile article list */}
          <div className="dash-mobile-list">
            {(stats?.recent || []).map(a => (
              <div key={a.id}
                onClick={() => navigate("edit", a.id)}
                style={{ padding:"10px 0", borderBottom:"1px solid var(--sl5)", cursor:"pointer" }}
              >
                <div style={{ fontFamily:"'Noto Sans Devanagari',sans-serif", fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:4, lineHeight:1.4 }}>
                  {a.headline.slice(0, 70)}{a.headline.length > 70 ? "…" : ""}
                </div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
                  {statusBadge(a.status)}
                  <span className="bdg bdg-blue">{a.category}</span>
                  <span style={{ fontSize:11, color:"#94a3b8", marginLeft:"auto" }}>
                    {new Date(a.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:14, textAlign:"right" }}>
            <button className="btn btn-outline btn-sm" onClick={() => navigate("articles")}>
              View All →
            </button>
          </div>
        </div>

        {/* Top articles */}
        <div className="card" style={{ marginBottom:0 }}>
          <div className="card-h">🔥 Top Articles by Views</div>
          {(stats?.topArticles || []).map((a, i) => (
            <div
              key={a.id}
              onClick={() => navigate("edit", a.id)}
              style={{
                display:"flex", gap:12, marginBottom:14, paddingBottom:14, cursor:"pointer",
                borderBottom: i < (stats.topArticles.length - 1) ? "1px solid var(--sl5)" : "none",
              }}
            >
              <span style={{ fontSize:22, fontWeight:900, color:"#e2e8f0", flexShrink:0, minWidth:26 }}>{i + 1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Noto Sans Devanagari',sans-serif", fontSize:13, fontWeight:700, lineHeight:1.5, color:"#1e293b", marginBottom:4 }}>
                  {a.headline.slice(0, 60)}{a.headline.length > 60 ? "…" : ""}
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                  <span className="bdg bdg-blue" style={{ fontSize:10 }}>{a.category}</span>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>👁 {(a.views || 0).toLocaleString()}</span>
                  {statusBadge(a.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
        }
        .dash-desktop-tbl { display: block; }
        .dash-mobile-list  { display: none; }
        @media (max-width: 900px) {
          .dash-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .dash-desktop-tbl { display: none; }
          .dash-mobile-list  { display: block; }
        }
      `}</style>
    </div>
  );
}
