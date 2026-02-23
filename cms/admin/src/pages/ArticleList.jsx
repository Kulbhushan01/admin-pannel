import { useState, useEffect } from "react";
import { api } from "../utils/api.js";

export default function ArticleList({ navigate, showToast }) {
  const [articles,   setArticles]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState({ status:"all", search:"", page:1 });
  const [delConfirm, setDelConfirm] = useState(null);

  const LIMIT = 15;

  function load(f = filter) {
    setLoading(true);
    api.getArticles({ ...f, limit: LIMIT })
      .then(d => {
        setArticles(d.articles);
        setTotal(d.total);
        setTotalPages(d.totalPages);
        setLoading(false);
      })
      .catch(() => { showToast("Failed to load", "error"); setLoading(false); });
  }

  useEffect(() => { load(); }, [filter.status, filter.page]);

  function search(e) {
    e.preventDefault();
    const f = { ...filter, page: 1 };
    setFilter(f);
    load(f);
  }

  async function changeStatus(id, status) {
    try {
      await api.setStatus(id, status);
      showToast(`Article ${status}`);
      load();
    } catch (e) { showToast(e.message || "Failed", "error"); }
  }

  async function del(id) {
    try {
      await api.deleteArticle(id);
      showToast("Article deleted");
      setDelConfirm(null);
      const newPage = articles.length === 1 && filter.page > 1 ? filter.page - 1 : filter.page;
      const f = { ...filter, page: newPage };
      setFilter(f);
      load(f);
    } catch (e) { showToast(e.message || "Delete failed", "error"); }
  }

  function statusBdg(s) {
    const m = { published:"bdg-green", draft:"bdg-yellow", archived:"bdg-slate" };
    return <span className={`bdg ${m[s] || "bdg-slate"}`}>● {s}</span>;
  }

  return (
    <div className="fade-up">

      {/* Delete confirm modal */}
      {delConfirm && (
        <div className="modal-bg" onClick={() => setDelConfirm(null)}>
          <div className="modal-box" style={{ padding:24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:12, color:"#0f172a" }}>🗑 Delete Article?</div>
            <div style={{ fontFamily:"'Noto Sans Devanagari',sans-serif", fontSize:14, color:"#64748b", marginBottom:20, lineHeight:1.7 }}>
              {delConfirm.headline}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button className="btn btn-outline" onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className="btn btn-red" onClick={() => del(delConfirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:"#0f172a" }}>Articles</h1>
          <p style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{total} total articles</p>
        </div>
        <button className="btn btn-brand" onClick={() => navigate("new")}>✏️ Add New</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding:"12px 16px", marginBottom:14 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          {/* Status tabs */}
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {["all","published","draft","archived"].map(s => (
              <button
                key={s}
                onClick={() => setFilter(p => ({ ...p, status:s, page:1 }))}
                className={`btn btn-sm ${filter.status === s ? "btn-dark" : "btn-outline"}`}
                style={{ textTransform:"capitalize" }}
              >{s}</button>
            ))}
          </div>
          {/* Search */}
          <form onSubmit={search} style={{ display:"flex", gap:6, flex:1, minWidth:160 }}>
            <input
              className="inp"
              style={{ flex:1, padding:"7px 10px", fontSize:13 }}
              placeholder="Search articles…"
              value={filter.search}
              onChange={e => setFilter(p => ({ ...p, search:e.target.value }))}
            />
            <button type="submit" className="btn btn-outline btn-sm">🔍</button>
          </form>
        </div>
      </div>

      {/* Article cards — replaces table on mobile, table on desktop */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:"48px", textAlign:"center", color:"#94a3b8" }}>⏳ Loading…</div>
        ) : articles.length === 0 ? (
          <div style={{ padding:"60px", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
            <div style={{ fontWeight:700, color:"#334155", marginBottom:4 }}>No articles found</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Try a different filter or add a new article</div>
          </div>
        ) : (
          <>
            {/* Desktop table — hidden on mobile */}
            <div className="tbl-wrap art-desktop-tbl">
              <table>
                <thead>
                  <tr>
                    <th style={{ paddingLeft:18, width:"38%" }}>Headline</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Breaking</th>
                    <th>Views</th>
                    <th>Author</th>
                    <th style={{ textAlign:"right", paddingRight:16 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(a => (
                    <tr key={a.id}>
                      <td style={{ paddingLeft:18, maxWidth:280 }}>
                        <div
                          style={{
                            fontFamily:"'Noto Sans Devanagari',sans-serif",
                            fontSize:13, fontWeight:700,
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                            cursor:"pointer", color:"#0f172a",
                          }}
                          onClick={() => navigate("edit", a.id)}
                          title={a.headline}
                        >
                          {a.headline}
                        </div>
                        <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>/{a.url?.slice(0,38)}</div>
                      </td>
                      <td><span className="bdg bdg-blue">{a.category}</span></td>
                      <td>{statusBdg(a.status)}</td>
                      <td>
                        {a.breaking
                          ? <span className="bdg bdg-red">🔴 Yes</span>
                          : <span style={{ color:"#cbd5e1", fontSize:11 }}>—</span>
                        }
                      </td>
                      <td style={{ fontSize:12, color:"#64748b" }}>{(a.views||0).toLocaleString()}</td>
                      <td style={{ fontSize:12, color:"#64748b" }}>{a.byline || "—"}</td>
                      <td style={{ textAlign:"right", paddingRight:14 }}>
                        <div style={{ display:"flex", gap:4, justifyContent:"flex-end" }}>
                          <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => navigate("edit", a.id)}>✏️</button>
                          {a.status !== "published"
                            ? <button className="btn btn-green btn-sm" onClick={() => changeStatus(a.id, "published")}>Publish</button>
                            : <button className="btn btn-outline btn-sm" onClick={() => changeStatus(a.id, "draft")}>Unpublish</button>
                          }
                          <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444" }} onClick={() => setDelConfirm(a)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards — one per article, shown below 768px */}
            <div className="art-mobile-list">
              {articles.map(a => (
                <div key={a.id} style={{
                  padding:"13px 14px",
                  borderBottom:"1px solid var(--sl5)",
                  background:"#fff",
                }}>
                  {/* Title row */}
                  <div
                    style={{
                      fontFamily:"'Noto Sans Devanagari',sans-serif",
                      fontSize:14, fontWeight:700, color:"#0f172a",
                      lineHeight:1.4, marginBottom:6, cursor:"pointer",
                    }}
                    onClick={() => navigate("edit", a.id)}
                  >
                    {a.headline}
                  </div>

                  {/* Meta row */}
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", marginBottom:8 }}>
                    {statusBdg(a.status)}
                    <span className="bdg bdg-blue">{a.category}</span>
                    {a.breaking && <span className="bdg bdg-red">🔴 Breaking</span>}
                    <span style={{ fontSize:11, color:"#94a3b8", marginLeft:"auto" }}>
                      {new Date(a.createdAt).toLocaleDateString("en-IN",{ day:"2-digit", month:"short" })}
                    </span>
                  </div>

                  {/* Action row */}
                  <div style={{ display:"flex", gap:6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate("edit", a.id)}>✏️ Edit</button>
                    {a.status !== "published"
                      ? <button className="btn btn-green btn-sm" onClick={() => changeStatus(a.id, "published")}>Publish</button>
                      : <button className="btn btn-outline btn-sm" onClick={() => changeStatus(a.id, "draft")}>Unpublish</button>
                    }
                    <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444" }} onClick={() => setDelConfirm(a)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, padding:"12px 16px", borderTop:"1px solid var(--sl5)" }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={filter.page <= 1}
              onClick={() => setFilter(p => ({ ...p, page: p.page - 1 }))}
            >← Prev</button>
            <span style={{ padding:"5px 12px", fontSize:12, color:"#64748b", fontWeight:600 }}>
              Page {filter.page} of {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={filter.page >= totalPages}
              onClick={() => setFilter(p => ({ ...p, page: p.page + 1 }))}
            >Next →</button>
          </div>
        )}
      </div>

      <style>{`
        .art-desktop-tbl { display: block; }
        .art-mobile-list  { display: none; }
        @media (max-width: 768px) {
          .art-desktop-tbl { display: none; }
          .art-mobile-list  { display: block; }
        }
      `}</style>
    </div>
  );
}
