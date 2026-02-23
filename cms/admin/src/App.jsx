import { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ArticleList from "./pages/ArticleList.jsx";
import ArticleEditor from "./pages/ArticleEditor.jsx";
import { api } from "./utils/api.js";

export default function App() {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState("dashboard"); // dashboard | articles | new | edit
  const [editId, setEditId] = useState(null);
  const [toast, setToast]   = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("mu_token");
    if (token) {
      api.me().then(u => { setUser(u); setLoading(false); })
              .catch(() => { localStorage.removeItem("mu_token"); setLoading(false); });
    } else setLoading(false);
  }, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function logout() {
    localStorage.removeItem("mu_token");
    setUser(null);
    setPage("dashboard");
  }

  function navigate(p, id = null) { setPage(p); setEditId(id); }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0f172a" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⚙️</div>
        <div style={{ color:"#94a3b8", fontSize:13 }}>Loading MU CMS…</div>
      </div>
    </div>
  );

  if (!user) return <Login onLogin={(u) => { setUser(u); showToast(`Welcome, ${u.name}!`); }} />;

  return (
    <Layout user={user} page={page} navigate={navigate} onLogout={logout}>
      {/* TOAST */}
      {toast && (
        <div style={{
          position:"fixed", top:68, right:20, zIndex:9999,
          background: toast.type === "error" ? "#ef4444" : toast.type === "warn" ? "#f59e0b" : "#22c55e",
          color:"#fff", padding:"10px 18px", borderRadius:8,
          fontSize:13, fontWeight:700, boxShadow:"0 4px 20px rgba(0,0,0,.2)",
          animation:"fadeUp .2s ease",
          display:"flex", alignItems:"center", gap:8,
        }}>
          <span>{toast.type==="error"?"❌":toast.type==="warn"?"⚠️":"✅"}</span>
          {toast.msg}
        </div>
      )}

      {page === "dashboard" && <Dashboard navigate={navigate} showToast={showToast} />}
      {page === "articles"  && <ArticleList navigate={navigate} showToast={showToast} />}
      {(page === "new" || page === "edit") && (
        <ArticleEditor
          id={editId}
          user={user}
          navigate={navigate}
          showToast={showToast}
        />
      )}
    </Layout>
  );
}
