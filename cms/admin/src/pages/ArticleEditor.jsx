import { useState, useEffect, useRef } from "react";
import { api } from "../utils/api.js";

function UploadZone({ label, hint, accept, onFile, preview, onRemove, icon = "⬆" }) {
  const ref = useRef();
  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }
  return (
    <div>
      {label && <label className="fl">{label}</label>}
      {preview ? (
        <div className="img-preview">
          {preview.type === "image" && <img src={preview.url} alt="preview" />}
          {preview.type === "video" && <video src={preview.url} controls style={{ width:"100%", maxHeight:200 }} />}
          {preview.type === "audio" && <audio src={preview.url} controls style={{ width:"100%", marginTop:8 }} />}
          <button className="rm" onClick={onRemove}>✕</button>
        </div>
      ) : (
        <div className="upz" onClick={() => ref.current.click()}
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
          <span className="upz-icon">{icon}</span>
          <span className="upz-text">Click here to Upload…</span>
          <span className="upz-hint">{hint}</span>
          <input ref={ref} type="file" accept={accept} style={{ display:"none" }}
            onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
        </div>
      )}
    </div>
  );
}

function MultiSelect({ label, options, value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(opt) {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  }
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <label className="fl">{label} <span className="opt">(Multi Selection)</span></label>
      <div className="chip-group" onClick={() => setOpen(o => !o)}>
        {value.length === 0 && <span style={{ color:"#94a3b8", fontSize:13 }}>Select topics</span>}
        {value.map(v => (
          <span key={v} className="chip">
            {v}
            <button className="chip-x" onClick={e => { e.stopPropagation(); toggle(v); }}>×</button>
          </span>
        ))}
      </div>
      {open && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:100, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,.1)", marginTop:4, maxHeight:200, overflowY:"auto" }}>
          {options.map(o => (
            <div key={o} onClick={() => toggle(o)} style={{
              padding:"9px 14px", fontSize:13, cursor:"pointer",
              background:value.includes(o)?"#fffbeb":"transparent",
              color:value.includes(o)?"#d97706":"#1e293b",
              fontWeight:value.includes(o)?700:400,
              display:"flex", alignItems:"center", gap:8,
              transition:"background .12s",
            }}
              onMouseOver={e => { if(!value.includes(o)) e.currentTarget.style.background="#f8fafc"; }}
              onMouseOut={e =>  { if(!value.includes(o)) e.currentTarget.style.background="transparent"; }}
            >
              {value.includes(o) ? "✓" : "○"} {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ArticleEditor({ id, user, navigate, showToast }) {
  const isEdit = !!id;
  const [busy,    setBusy]    = useState(false);
  const [loading, setLoading] = useState(isEdit);
  // FIX: Separate tab state for image and video sections
  const [imgTab, setImgTab]   = useState("Header");
  const [vidTab, setVidTab]   = useState("Header");
  const [categories, setCategories] = useState([]);
  const [topics,     setTopics]     = useState([]);
  const [buckets,    setBuckets]    = useState([]);
  const [timer,      setTimer]      = useState(0);

  // FIX: roughWork is LOCAL only — never included in API saves
  const [roughWork, setRoughWork] = useState("");

  const [form, setForm] = useState({
    templateType:    "article",
    byline:          "",
    articleTemplate: "Normal News",
    propertyTag:     "",
    dateline:        "",
    publishDate:     new Date().toISOString(),
    paywallType:     "Default",
    displayTopic:    "",
    contentBucket:   "",
    headline:        "",
    copy:            "",
    videoEditor:     "",
    videoProducer:   "",
    category:        "",
    trendingTopics:  [],
    url:             "",
    metaTitle:       "",
    metaDescription: "",
    seoKeyword:      "",
    newsType:        [],
    shelfLife:       "Default",
    breaking:        false,
    featured:        false,
    status:          "draft",
    coverImage:      null,
    video:           null,
    audioSummary:    null,
  });

  const [imgPreview, setImgPreview]     = useState(null);
  const [vidPreview, setVidPreview]     = useState(null);
  const [audPreview, setAudPreview]     = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVid, setUploadingVid] = useState(false);
  const [uploadingAud, setUploadingAud] = useState(false);

  // Word counts
  const headlineWC = (form.headline||"").split(/\s+/).filter(Boolean).length;
  const topicWC    = (form.displayTopic||"").split(/\s+/).filter(Boolean).length;
  const copyWC     = (form.copy||"").split(/\s+/).filter(Boolean).length;
  const roughWC    = roughWork.split(/\s+/).filter(Boolean).length;

  // Timer like OneCMS
  useEffect(() => {
    const t = setInterval(() => setTimer(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const timerStr = String(Math.floor(timer/60)).padStart(2,"0") + ":" + String(timer%60).padStart(2,"0");

  useEffect(() => {
    // FIX: getBuckets needs auth — handle error gracefully so other dropdowns still load
    Promise.allSettled([api.getCategories(), api.getTopics(), api.getBuckets()])
      .then(([cats, tops, bkts]) => {
        if (cats.status === "fulfilled") setCategories(cats.value);
        if (tops.status === "fulfilled") setTopics(tops.value);
        if (bkts.status === "fulfilled") setBuckets(bkts.value);
        else showToast("Could not load content buckets", "warn");
      });

    if (isEdit) {
      api.getArticle(id).then(a => {
        // FIX: roughWork from DB is ignored — it was saved by the old version
        // We intentionally don't restore it; the field is scratch-only
        const { roughWork: _discard, ...rest } = a;
        setForm(prev => ({ ...prev, ...rest }));
        if (a.coverImage)    setImgPreview({ type:"image", url:a.coverImage });
        if (a.video)         setVidPreview({ type:"video", url:a.video });
        if (a.audioSummary)  setAudPreview({ type:"audio", url:a.audioSummary });
        setLoading(false);
      }).catch(() => { showToast("Load failed", "error"); setLoading(false); });
    }
  }, []);

  function set(k, v) { setForm(p => ({ ...p, [k]:v })); }

  function autoUrl() {
    const slug = (form.headline||"")
      .replace(/\s+/g,"-")
      .replace(/[^\w\-\u0900-\u097F]/g,"")
      .slice(0,60).toLowerCase();
    set("url", slug);
  }

  async function handleImageUpload(file) {
    setUploadingImg(true);
    try {
      const { url } = await api.uploadImage(file);
      set("coverImage", url);
      setImgPreview({ type:"image", url });
    } catch(e) { showToast(e.message || "Image upload failed","error"); }
    setUploadingImg(false);
  }
  async function handleVideoUpload(file) {
    setUploadingVid(true);
    try {
      const { url } = await api.uploadVideo(file);
      set("video", url);
      setVidPreview({ type:"video", url });
    } catch(e) { showToast(e.message || "Video upload failed","error"); }
    setUploadingVid(false);
  }
  async function handleAudioUpload(file) {
    setUploadingAud(true);
    try {
      const { url } = await api.uploadAudio(file);
      set("audioSummary", url);
      setAudPreview({ type:"audio", url });
    } catch(e) { showToast(e.message || "Audio upload failed","error"); }
    setUploadingAud(false);
  }

  async function save(status = form.status) {
    if (!form.headline.trim()) return showToast("Headline required","warn");
    setBusy(true);
    try {
      // FIX: roughWork is intentionally excluded from the payload — it's local scratch only
      const payload = { ...form, status };
      if (isEdit) await api.updateArticle(id, payload);
      else        await api.createArticle(payload);
      showToast(status === "published" ? "✅ Published!" : "💾 Draft saved!");
      navigate("articles");
    } catch(e) { showToast(e.message,"error"); }
    setBusy(false);
  }

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
      <div style={{ textAlign:"center", color:"#94a3b8" }}>⏳ Loading article…</div>
    </div>
  );

  return (
    <div className="fade-up" style={{ maxWidth:900, margin:"0 auto" }}>

      {/* Breadcrumb + Timer */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontSize:12, color:"#94a3b8" }}>
          <span onClick={()=>navigate("dashboard")} style={{ cursor:"pointer" }}>Home</span>
          <span style={{ margin:"0 6px" }}>›</span>
          <span style={{ color:"#f59e0b" }}>{isEdit ? "Edit Article" : "Add New"}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontSize:13, color:"#64748b", display:"flex", alignItems:"center", gap:5 }}>
            <span>🕐</span>
            <span style={{ fontWeight:700, fontVariantNumeric:"tabular-nums", color:"#0f172a" }}>{timerStr}</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-outline btn-sm" onClick={()=>navigate("articles")}>← Back</button>
            <button className="btn btn-brand btn-sm" onClick={() => save("published")} disabled={busy}>
              {busy?"Saving…":"🚀 Publish Now"}
            </button>
            <button className="btn btn-dark btn-sm" onClick={() => save("draft")} disabled={busy}>
              💾 Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Article Meta */}
      <div className="card">
        <div className="card-h">📋 Article Information</div>

        <div className="fg">
          <label className="fl">Template Type</label>
          <div className="r-group">
            {["article","interactive"].map(t => (
              <label key={t} className="r-item">
                <input type="radio" name="templateType" value={t}
                  checked={form.templateType===t} onChange={e=>set("templateType",e.target.value)} />
                <span style={{ textTransform:"capitalize" }}>{t}</span>
              </label>
            ))}
            <button className="btn btn-dark btn-sm" style={{ marginLeft:"auto" }}>+ Add Video Input</button>
          </div>
        </div>

        <div className="fg2">
          <div className="fg">
            <label className="fl">Byline</label>
            <select className="sel" value={form.byline} onChange={e=>set("byline",e.target.value)}>
              <option value="">टीम मराठी</option>
              <option value="Sanjay Patil">Sanjay Patil</option>
              <option value="Priya Mehta">Priya Mehta</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="fg">
            <label className="fl">Article Template</label>
            <select className="sel" value={form.articleTemplate} onChange={e=>set("articleTemplate",e.target.value)}>
              {["Normal News","Photo Essay","Explainer","Live Blog","Interview","Opinion","Video Story"].map(t=>(
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="fg2">
          <div className="fg">
            <label className="fl">Property Tag <span className="opt">(Optional)</span></label>
            <select className="sel" value={form.propertyTag} onChange={e=>set("propertyTag",e.target.value)}>
              <option value="">Select Property Tag</option>
              {["Exclusive","Breaking","Sponsored","Partner Content"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Dateline <span className="opt">(Optional)</span></label>
            <input className="inp" placeholder="e.g. MUMBAI" value={form.dateline} onChange={e=>set("dateline",e.target.value)} />
          </div>
        </div>

        <div className="fg2">
          <div className="fg">
            <label className="fl">Publish Date</label>
            <input className="inp" type="datetime-local"
              value={form.publishDate ? new Date(form.publishDate).toISOString().slice(0,16) : ""}
              onChange={e => set("publishDate", e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Paywall Type</label>
            <select className="sel" value={form.paywallType} onChange={e=>set("paywallType",e.target.value)}>
              {["Default","Free","Metered","Hard Paywall","Subscriber Only"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="fg2">
          <div className="fg">
            <label className="fl">
              Display Topic <span className="opt">(Limit: 10 words)</span>
              <span className="wc" style={{color:topicWC>10?"#ef4444":undefined}}>Words: {topicWC}/10</span>
            </label>
            <input className="inp" placeholder="Display Topic"
              value={form.displayTopic}
              onChange={e => set("displayTopic", e.target.value)}
              style={{ borderColor: topicWC>10?"#ef4444":undefined }} />
          </div>
          <div className="fg">
            <label className="fl">Content Bucket</label>
            <select className="sel" value={form.contentBucket} onChange={e=>set("contentBucket",e.target.value)}>
              <option value="">Select</option>
              {buckets.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: Headline + Content */}
      <div className="card">
        <div className="card-h">✏️ Content</div>

        <div className="fg">
          <label className="fl">
            Headline <span className="opt">(Limit: 25 words)</span>
            <span className="wc" style={{color:headlineWC>25?"#ef4444":undefined}}>Words: {headlineWC}/25</span>
          </label>
          <textarea className="ta" rows={2}
            placeholder="बातमीचे शीर्षक लिहा…"
            value={form.headline}
            onChange={e => set("headline", e.target.value)}
            style={{
              fontFamily:"'Noto Sans Devanagari',sans-serif",
              fontSize:15, fontWeight:700,
              borderColor: headlineWC>25?"#ef4444":undefined,
            }}
          />
        </div>

        {/* FIX: roughWork uses local state — never sent to backend */}
        <div className="fg">
          <label className="fl" style={{ display:"flex", justifyContent:"space-between" }}>
            <span>
              Rough Work
              <span style={{ fontSize:10, fontWeight:400, color:"#94a3b8", textTransform:"none", letterSpacing:0, marginLeft:6 }}>
                (Scratch space — not saved to the article)
              </span>
            </span>
            <span className="wc">Words: {roughWC}</span>
          </label>
          <textarea className="ta" rows={3}
            placeholder="Temporary notes — cleared when you close this page…"
            value={roughWork}
            onChange={e => setRoughWork(e.target.value)}
            style={{ background:"#fffbeb" }}
          />
        </div>

        {/* Copy with rich text toolbar */}
        <div className="fg">
          <label className="fl" style={{ display:"flex", justifyContent:"space-between" }}>
            <span>Copy</span>
            <span style={{ display:"flex", gap:16 }}>
              <span className="wc">Words: {copyWC}</span>
              <span style={{ fontSize:11, color:"#94a3b8" }}>Scroll: 0 (Approx)</span>
            </span>
          </label>
          <div className="toolbar">
            <div style={{ display:"flex", alignItems:"center", gap:2 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#64748b", padding:"0 4px" }}>AA</span>
              <span style={{ fontSize:11, color:"#64748b" }}>∨</span>
            </div>
            <div className="tb-sep"/>
            {["B","I","T̶"].map(t=><button key={t} className="tb-btn" style={{fontStyle:t==="I"?"italic":undefined}}>{t}</button>)}
            <button className="tb-btn" style={{fontSize:14}}>🔗</button>
            <div className="tb-sep"/>
            {["↩","↪"].map(t=><button key={t} className="tb-btn">{t}</button>)}
            <div className="tb-sep"/>
            {["≡","≡≡"].map(t=><button key={t} className="tb-btn">{t}</button>)}
            <div className="tb-sep"/>
            <button className="tb-btn" style={{fontSize:14}}>⊞∨</button>
            <div className="tb-sep"/>
            <button className="tb-btn">⏺</button>
            <button className="tb-btn" style={{fontSize:14}}>🖼</button>
            <button className="tb-btn" style={{fontSize:12,fontWeight:800,letterSpacing:-1}}>⏪</button>
            <button className="tb-btn">꧅</button>
            <button className="tb-btn">◫</button>
            <button className="tb-btn">❝</button>
            <button className="tb-btn">≡∨</button>
            <div className="tb-sep"/>
            <button className="tb-btn">🔍</button>
            <button className="tb-btn">↹</button>
            <button className="tb-btn">⧉</button>
            <button className="tb-btn">Ω</button>
          </div>
          <textarea className="rta"
            placeholder="बातमीचा मजकूर लिहा…"
            value={form.copy}
            onChange={e => set("copy", e.target.value)}
            rows={10}
          />
        </div>
      </div>

      {/* SECTION 3: Cover Image — with its own tab state */}
      <div className="card">
        <div className="card-h">🖼 Add Cover Image</div>
        {/* FIX: imgTab is now independent from vidTab */}
        <div className="tabs">
          {["Header","Thumbnail","AMP"].map(t => (
            <button key={t} className={`tab-btn${imgTab===t?" act":""}`} onClick={() => setImgTab(t)}>{t}</button>
          ))}
        </div>
        <UploadZone
          label={`Cover Image (${imgTab})`}
          hint={`Size: ${imgTab==="Header"?"730(W) px × 548(H) px":"400×300 px"} · JPG, PNG, WebP`}
          accept="image/*"
          onFile={handleImageUpload}
          preview={imgPreview}
          onRemove={() => { setImgPreview(null); set("coverImage",null); }}
          icon={uploadingImg ? "⏳" : "⬆"}
        />
      </div>

      {/* SECTION 4: Video — with its own independent tab state */}
      <div className="card">
        <div className="card-h">🎬 Video</div>
        {/* FIX: vidTab is independent — switching image tabs no longer affects this */}
        <div className="tabs">
          {["Header","Thumbnail"].map(t => (
            <button key={t} className={`tab-btn${vidTab===t?" act":""}`} onClick={() => setVidTab(t)}>{t}</button>
          ))}
        </div>
        <UploadZone
          label="Video"
          hint="Aspect Ratio · 9:16 · MP4, MOV, WebM"
          accept="video/*"
          onFile={handleVideoUpload}
          preview={vidPreview}
          onRemove={() => { setVidPreview(null); set("video",null); }}
          icon={uploadingVid ? "⏳" : "📹"}
        />
        <div className="fg2" style={{ marginTop:16 }}>
          <div className="fg">
            <label className="fl">Video Editor</label>
            <select className="sel" value={form.videoEditor} onChange={e=>set("videoEditor",e.target.value)}>
              <option value="">Select</option>
              {["Rahul","Priya","Amit","Sunita"].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Video Producer</label>
            <select className="sel" value={form.videoProducer} onChange={e=>set("videoProducer",e.target.value)}>
              <option value="">Select</option>
              {["Neha","Vikram","Smita","Rohan"].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 5: Audio Summary */}
      <div className="card">
        <div className="card-h">🎵 Audio Summary <span style={{fontWeight:400,fontSize:11,color:"#94a3b8",textTransform:"none",letterSpacing:0}}>(Optional)</span></div>
        <div style={{ fontSize:12, color:"#94a3b8", marginBottom:10 }}>Audio file (.m4a, .mp3)</div>
        <UploadZone
          label=""
          hint="Drag and drop file here or click to upload"
          accept=".m4a,audio/*"
          onFile={handleAudioUpload}
          preview={audPreview}
          onRemove={() => { setAudPreview(null); set("audioSummary",null); }}
          icon={uploadingAud ? "⏳" : "🎵"}
        />
      </div>

      {/* SECTION 6: SEO + Meta + Category */}
      <div className="card">
        <div className="card-h">🔍 Category, SEO & Meta</div>

        <div className="fg">
          <label className="fl">Category</label>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ background:"#f59e0b", borderRadius:4, padding:"6px 12px", fontSize:11, fontWeight:900, color:"#fff", cursor:"pointer", flexShrink:0 }}>+</div>
            <select className="sel" value={form.category} onChange={e=>set("category",e.target.value)}>
              <option value="">Select Category</option>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="fg">
          <MultiSelect label="Trending Topic" options={topics}
            value={form.trendingTopics} onChange={v=>set("trendingTopics",v)} />
        </div>

        <div className="fg">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
            <label className="fl" style={{ margin:0 }}>URL</label>
            <button className="btn btn-brand btn-sm" onClick={autoUrl}>⚙ Generate</button>
          </div>
          <input className="inp" placeholder="article-url-slug"
            value={form.url} onChange={e=>set("url",e.target.value)} />
        </div>

        <div className="fg">
          <label className="fl">Meta Title (English)</label>
          <input className="inp" placeholder="Title" value={form.metaTitle} onChange={e=>set("metaTitle",e.target.value)} />
        </div>

        <div className="fg">
          <label className="fl">Meta Description</label>
          <textarea className="ta" rows={3} placeholder="Meta Description"
            value={form.metaDescription} onChange={e=>set("metaDescription",e.target.value)} />
        </div>

        <div className="fg">
          <label className="fl">SEO Keyword</label>
          <textarea className="ta" rows={2} placeholder="SEO Keyword"
            value={form.seoKeyword} onChange={e=>set("seoKeyword",e.target.value)} />
        </div>

        <div className="fg2">
          <div className="fg">
            <MultiSelect label="News Type" options={["ताज्या बातम्या","ब्रेकिंग","विशेष","मुलाखत","विश्लेषण","थेट"]}
              value={form.newsType} onChange={v=>set("newsType",v)} />
          </div>
          <div className="fg">
            <label className="fl">Shelf Life</label>
            <select className="sel" value={form.shelfLife} onChange={e=>set("shelfLife",e.target.value)}>
              {["Default","24 Hours","48 Hours","1 Week","1 Month","Evergreen"].map(s=>(
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display:"flex", gap:24, flexWrap:"wrap", padding:"12px 0", borderTop:"1px solid #f1f5f9" }}>
          <label className="chk">
            <input type="checkbox" checked={form.breaking} onChange={e=>set("breaking",e.target.checked)} />
            <span style={{ fontWeight:700, color:"#ef4444" }}>🔴 Breaking News</span>
          </label>
          <label className="chk">
            <input type="checkbox" checked={form.featured} onChange={e=>set("featured",e.target.checked)} />
            <span style={{ fontWeight:700, color:"#f59e0b" }}>⭐ Featured</span>
          </label>
        </div>
      </div>

      {/* SAVE BAR */}
      <div className="save-bar">
        <div className="save-bar-l">
          <span className={`bdg ${form.status==="published"?"bdg-green":form.status==="draft"?"bdg-yellow":"bdg-slate"}`}>
            ● {form.status}
          </span>
          <span style={{ fontSize:12, color:"#94a3b8" }}>
            {isEdit ? "Last saved: Just now" : "Not saved yet"}
          </span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn btn-outline" onClick={() => navigate("articles")}>Cancel</button>
          <button className="btn btn-dark" onClick={() => save("draft")} disabled={busy}>
            {busy?"Saving…":"💾 Save Draft"}
          </button>
          <button className="btn btn-green" onClick={() => save("published")} disabled={busy}>
            {busy?"Publishing…":"🚀 Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
