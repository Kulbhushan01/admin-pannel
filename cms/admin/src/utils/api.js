const BASE = "http://localhost:5000/api";

function getToken() { return localStorage.getItem("mu_token"); }
function headers(isForm = false) {
  const h = { Authorization: `Bearer ${getToken()}` };
  if (!isForm) h["Content-Type"] = "application/json";
  return h;
}

async function req(method, path, body, isForm) {
  const res = await fetch(BASE + path, {
    method,
    headers: headers(isForm),
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  login:           (email, password) => req("POST", "/auth/login", { email, password }),
  me:              () => req("GET", "/auth/me"),
  getStats:        () => req("GET", "/stats"),
  getArticles:     (params = {}) => req("GET", "/articles?" + new URLSearchParams(params)),
  getArticle:      (id) => req("GET", `/articles/${id}`),
  createArticle:   (data) => req("POST", "/articles", data),
  updateArticle:   (id, data) => req("PUT", `/articles/${id}`, data),
  deleteArticle:   (id) => req("DELETE", `/articles/${id}`),
  setStatus:       (id, status) => req("PATCH", `/articles/${id}/status`, { status }),
  uploadImage:     (file) => { const f = new FormData(); f.append("image", file); return req("POST", "/upload/image", f, true); },
  uploadVideo:     (file) => { const f = new FormData(); f.append("video", file); return req("POST", "/upload/video", f, true); },
  uploadAudio:     (file) => { const f = new FormData(); f.append("audio", file); return req("POST", "/upload/audio", f, true); },
  getCategories:   () => req("GET", "/categories"),
  getTopics:       () => req("GET", "/topics"),
  getBuckets:      () => req("GET", "/content-buckets"),
};
