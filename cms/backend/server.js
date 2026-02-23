const express  = require("express");
const cors     = require("cors");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const { v4: uuid }  = require("uuid");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");

const app  = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "mu-cms-dev-secret-2026";

// ── CORS: allow both the admin panel and the website ────────
app.use(cors({
  origin: function(origin, cb) {
    // Allow requests with no origin (curl, Postman) or from localhost
    const allowed = [
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:4173",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:5173",
    ];
    if (!origin || allowed.includes(origin)) return cb(null, true);
    // During dev, allow any localhost port
    if (origin && origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) return cb(null, true);
    return cb(null, true); // Allow all for local development
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create upload dirs
["uploads/images","uploads/videos","uploads/audio"].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── FILE UPLOAD ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("video/"))      cb(null, "uploads/videos");
    else if (file.mimetype.startsWith("audio/")) cb(null, "uploads/audio");
    else                                          cb(null, "uploads/images");
  },
  filename: (req, file, cb) => cb(null, uuid() + path.extname(file.originalname).toLowerCase()),
});
const uploadImage = multer({ storage, limits: { fileSize: 10  * 1024 * 1024 } });
const uploadVideo = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });
const uploadAudio = multer({ storage, limits: { fileSize: 50  * 1024 * 1024 } });

// ── DATABASE ─────────────────────────────────────────────────
const DB_FILE = path.join(__dirname, "db.json");

function getDefaultDB() {
  // Hash passwords at startup — always fresh bcrypt hashes
  return {
    users: [
      { id:"u1", name:"Admin",        email:"admin@mu.in",  password: bcrypt.hashSync("admin123", 10), role:"admin"    },
      { id:"u2", name:"Amruta Jadhav",email:"amruta@mu.in", password: bcrypt.hashSync("pass123",  10), role:"editor"   },
      { id:"u3", name:"demo_user",    email:"demo@mu.in",   password: bcrypt.hashSync("demo123",  10), role:"reporter" },
    ],
    articles: [
      {
        id:"a1", status:"published", breaking:true, featured:true,
        headline:"महाराष्ट्र विधानसभेत नवीन कृषी विधेयक मंजूर",
        copy:"महाराष्ट्र विधानसभेने आज ऐतिहासिक कृषी विधेयक मंजूर केले. या विधेयकामुळे शेतकऱ्यांना थेट बाजारपेठेत विक्री करण्याचा अधिकार मिळेल.",
        category:"राजकारण", byline:"Amruta Jadhav",
        metaDescription:"राज्य सरकारने शेतकऱ्यांच्या हिताचे महत्त्वपूर्ण विधेयक मंजूर केले.",
        trendingTopics:["शेती","सरकार"],
        coverImage:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
        url:"maharashtra-krushi-vidheyak", views:12850,
        publishDate: new Date().toISOString(),
        createdAt: new Date(Date.now()-7200000).toISOString(),
        updatedAt: new Date().toISOString(), createdBy:"u2",
      },
      {
        id:"a2", status:"published", breaking:true, featured:true,
        headline:"मुंबई मेट्रो लाइन ३ चे उद्घाटन; प्रवाशांचा उत्साह",
        copy:"मुंबई मेट्रो लाइन ३ वर आज प्रवासी सेवा सुरू झाली. पहिल्या दिवशी हजारो प्रवाशांनी प्रवास केला.",
        category:"मुंबई", byline:"Admin",
        metaDescription:"आरे ते BKC मेट्रो मार्गावर प्रवासी सेवा सुरू झाली.",
        trendingTopics:["वाहतूक"],
        coverImage:"https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80",
        url:"mumbai-metro-line-3-launch", views:18000,
        publishDate: new Date(Date.now()-3600000).toISOString(),
        createdAt: new Date(Date.now()-3600000).toISOString(),
        updatedAt: new Date().toISOString(), createdBy:"u1",
      },
      {
        id:"a3", status:"published", breaking:false, featured:true,
        headline:"IPL 2026: मुंबई इंडियन्सने शेवटच्या बॉलवर थरारक विजय मिळवला",
        copy:"वानखेडे स्टेडियमवर झालेल्या सामन्यात मुंबई इंडियन्सने CSK विरुद्ध ३ विकेट्सने विजय मिळवला.",
        category:"क्रीडा", byline:"demo_user",
        metaDescription:"मुंबई इंडियन्सने शेवटच्या बॉलवर सामना जिंकला.",
        trendingTopics:["क्रिकेट","IPL"],
        coverImage:"https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
        url:"ipl-2026-mi-win", views:22000,
        publishDate: new Date(Date.now()-7200000).toISOString(),
        createdAt: new Date(Date.now()-7200000).toISOString(),
        updatedAt: new Date().toISOString(), createdBy:"u3",
      },
      {
        id:"a4", status:"published", breaking:false, featured:false,
        headline:"पुण्यात IT पार्कसाठी ₹५,००० कोटींची गुंतवणूक जाहीर",
        copy:"हिंजवडी येथे नवीन IT पार्क उभारण्यासाठी पाच हजार कोटींची गुंतवणूक जाहीर करण्यात आली.",
        category:"व्यापार", byline:"Amruta Jadhav",
        metaDescription:"हिंजवडी येथे नवीन IT पार्कसाठी मोठी गुंतवणूक.",
        trendingTopics:["AI"],
        coverImage:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
        url:"pune-it-park-investment", views:6700,
        publishDate: new Date(Date.now()-10800000).toISOString(),
        createdAt: new Date(Date.now()-10800000).toISOString(),
        updatedAt: new Date().toISOString(), createdBy:"u2",
      },
      {
        id:"a5", status:"published", breaking:true, featured:false,
        headline:"कोल्हापुरात पूरस्थिती; प्रशासन सतर्क, बचाव पथके तैनात",
        copy:"कोल्हापूर जिल्ह्यात मागील ४८ तासांत अतिवृष्टी झाली. पंचगंगा नदीने धोका पातळी ओलांडली.",
        category:"महाराष्ट्र", byline:"Amruta Jadhav",
        metaDescription:"कोल्हापुरात पंचगंगा नदी धोका पातळीच्या वर.",
        trendingTopics:["शेती"],
        coverImage:"https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
        url:"kolhapur-flood-alert", views:3400,
        publishDate: new Date(Date.now()-14400000).toISOString(),
        createdAt: new Date(Date.now()-14400000).toISOString(),
        updatedAt: new Date().toISOString(), createdBy:"u2",
      },
      {
        id:"a6", status:"published", breaking:false, featured:false,
        headline:"पुणे विद्यापीठात AI संशोधन केंद्र उभारणार",
        copy:"सावित्रीबाई फुले पुणे विद्यापीठात कृत्रिम बुद्धिमत्ता संशोधन केंद्र उघडले जाणार आहे.",
        category:"तंत्रज्ञान", byline:"Admin",
        metaDescription:"पुणे विद्यापीठात AI संशोधन केंद्र.",
        trendingTopics:["AI","शिक्षण"],
        coverImage:"https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80",
        url:"pune-university-ai-center", views:4200,
        publishDate: new Date(Date.now()-18000000).toISOString(),
        createdAt: new Date(Date.now()-18000000).toISOString(),
        updatedAt: new Date().toISOString(), createdBy:"u1",
      },
      {
        id:"a7", status:"published", breaking:false, featured:false,
        headline:"नाशिकमध्ये द्राक्ष उत्पादकांना मोठा दिलासा",
        copy:"नाशिक जिल्ह्यातील द्राक्ष उत्पादकांना यंदा निर्यातीसाठी चांगला भाव मिळाला.",
        category:"महाराष्ट्र", byline:"Amruta Jadhav",
        metaDescription:"नाशिकच्या द्राक्ष उत्पादकांना निर्यातीचा फायदा.",
        trendingTopics:["शेती"],
        coverImage:"https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&q=80",
        url:"nashik-grape-export", views:2800,
        publishDate: new Date(Date.now()-21600000).toISOString(),
        createdAt: new Date(Date.now()-21600000).toISOString(),
        updatedAt: new Date().toISOString(), createdBy:"u2",
      },
      {
        id:"a8", status:"published", breaking:false, featured:false,
        headline:"मुंबई पोलिसांनी सायबर फसवणूक टोळीला केले जेरबंद",
        copy:"मुंबई पोलिसांच्या सायबर सेलने ऑनलाइन फसवणूक करणाऱ्या आठ जणांना अटक केली.",
        category:"मुंबई", byline:"demo_user",
        metaDescription:"मुंबई पोलिसांकडून सायबर गुन्हेगार अटकेत.",
        trendingTopics:[],
        coverImage:"https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80",
        url:"mumbai-cyber-crime-arrest", views:5100,
        publishDate: new Date(Date.now()-25200000).toISOString(),
        createdAt: new Date(Date.now()-25200000).toISOString(),
        updatedAt: new Date().toISOString(), createdBy:"u3",
      },
      {
        id:"a9", status:"published", breaking:false, featured:false,
        headline:"शालेय परीक्षा निकाल: राज्यात ९२% उत्तीर्ण",
        copy:"महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळाने आज निकाल जाहीर केला.",
        category:"शिक्षण", byline:"Admin",
        metaDescription:"महाराष्ट्र शालेय परीक्षा निकाल: ९२% उत्तीर्ण.",
        trendingTopics:["शिक्षण"],
        coverImage:"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
        url:"maharashtra-school-result", views:8900,
        publishDate: new Date(Date.now()-28800000).toISOString(),
        createdAt: new Date(Date.now()-28800000).toISOString(),
        updatedAt: new Date().toISOString(), createdBy:"u1",
      },
      {
        id:"a10", status:"published", breaking:false, featured:false,
        headline:"छत्रपती संभाजीनगरात नवीन रुग्णालय सुरू",
        copy:"छत्रपती संभाजीनगर येथे ३०० खाटांचे अत्याधुनिक रुग्णालय सुरू करण्यात आले.",
        category:"आरोग्य", byline:"Amruta Jadhav",
        metaDescription:"छत्रपती संभाजीनगरात नवीन अत्याधुनिक रुग्णालय.",
        trendingTopics:["आरोग्य"],
        coverImage:"https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80",
        url:"aurangabad-new-hospital", views:3100,
        publishDate: new Date(Date.now()-32400000).toISOString(),
        createdAt: new Date(Date.now()-32400000).toISOString(),
        updatedAt: new Date().toISOString(), createdBy:"u2",
      },
    ],
    categories:["महाराष्ट्र","मुंबई","राजकारण","क्रीडा","व्यापार","मनोरंजन","शिक्षण","आरोग्य","तंत्रज्ञान","गुन्हेगारी"],
    topics:["शेती","वाहतूक","राजकारण","क्रिकेट","IPL","शेअर बाजार","AI","शिक्षण","आरोग्य"],
    contentBuckets:["Breaking","Featured","Trending","Special Report","Opinion","Exclusive"],
  };
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const db  = JSON.parse(raw);
      // Validate: if users exist but passwords look like plain text (< 20 chars), reset
      if (db.users && db.users.length > 0) {
        const hasInvalidHash = db.users.some(u => u.password && u.password.length < 30);
        if (hasInvalidHash) {
          console.warn("⚠️  db.json has plain-text passwords — resetting to hashed defaults");
          const fresh = getDefaultDB();
          fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2));
          return fresh;
        }
      }
      return db;
    }
  } catch (e) {
    console.error("DB read error:", e.message);
  }
  return getDefaultDB();
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ── AUTH MIDDLEWARE ──────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided" });
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: `Requires role: ${roles.join(" or ")}` });
    next();
  };
}

// ── AUTH ROUTES ──────────────────────────────────────────────
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const db   = loadDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      console.log(`Login failed: no user with email "${email}"`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      console.log(`Login failed: wrong password for "${email}"`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log(`✅ Login: ${user.name} (${user.role})`);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.get("/api/auth/me", auth, (req, res) => {
  const db   = loadDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password, ...safe } = user;
  res.json(safe);
});

// ── RESET ENDPOINT (dev only) ────────────────────────────────
// DELETE this endpoint before going to production!
app.post("/api/dev/reset-db", (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    const fresh = getDefaultDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2));
    res.json({ message: "DB reset to defaults", users: fresh.users.map(u => ({ name:u.name, email:u.email, role:u.role })) });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ARTICLES (protected) ─────────────────────────────────────
app.get("/api/articles", auth, (req, res) => {
  const db = loadDB();
  let list = [...db.articles];
  const { status, category, search, page = 1, limit = 15 } = req.query;
  if (status && status !== "all") list = list.filter(a => a.status === status);
  if (category) list = list.filter(a => a.category === category);
  if (search)   list = list.filter(a => (a.headline || "").includes(search) || (a.copy || "").includes(search));
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = list.length;
  const data  = list.slice((page - 1) * limit, page * limit);
  res.json({ articles: data, total, page: +page, totalPages: Math.ceil(total / limit) });
});

app.get("/api/articles/:id", auth, (req, res) => {
  const db = loadDB();
  const a  = db.articles.find(a => a.id === req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  res.json(a);
});

app.post("/api/articles", auth, (req, res) => {
  const db = loadDB();
  const isReporter = req.user.role === "reporter";
  const status = (isReporter && req.body.status === "published") ? "draft" : (req.body.status || "draft");
  const article = {
    id: uuid(),
    ...req.body,
    status,
    views: 0,
    createdBy:  req.user.id,
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
  };
  if (!article.url && article.headline) {
    article.url = article.headline.replace(/\s+/g, "-").replace(/[^\w\u0900-\u097F-]/g, "").slice(0, 60).toLowerCase();
  }
  db.articles.unshift(article);
  saveDB(db);
  res.status(201).json(article);
});

app.put("/api/articles/:id", auth, (req, res) => {
  const db  = loadDB();
  const idx = db.articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  if (req.user.role === "reporter" && db.articles[idx].createdBy !== req.user.id)
    return res.status(403).json({ error: "Can only edit your own articles" });
  const updates = { ...req.body };
  if (req.user.role === "reporter" && updates.status === "published") updates.status = "draft";
  db.articles[idx] = { ...db.articles[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDB(db);
  res.json(db.articles[idx]);
});

app.delete("/api/articles/:id", auth, requireRole("admin","editor"), (req, res) => {
  const db  = loadDB();
  const idx = db.articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  db.articles.splice(idx, 1);
  saveDB(db);
  res.json({ message: "Deleted" });
});

app.patch("/api/articles/:id/status", auth, requireRole("admin","editor"), (req, res) => {
  const db  = loadDB();
  const idx = db.articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const valid = ["published","draft","archived"];
  if (!valid.includes(req.body.status))
    return res.status(400).json({ error: `Status must be: ${valid.join(", ")}` });
  db.articles[idx].status    = req.body.status;
  db.articles[idx].updatedAt = new Date().toISOString();
  if (req.body.status === "published") db.articles[idx].publishDate = new Date().toISOString();
  saveDB(db);
  res.json(db.articles[idx]);
});

// ── UPLOADS ──────────────────────────────────────────────────
app.post("/api/upload/image", auth, uploadImage.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `http://localhost:${PORT}/uploads/images/${req.file.filename}` });
});
app.post("/api/upload/video", auth, uploadVideo.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `http://localhost:${PORT}/uploads/videos/${req.file.filename}` });
});
app.post("/api/upload/audio", auth, uploadAudio.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `http://localhost:${PORT}/uploads/audio/${req.file.filename}` });
});

// ── STATS ─────────────────────────────────────────────────────
app.get("/api/stats", auth, (req, res) => {
  const db = loadDB();
  const a  = db.articles;
  res.json({
    total:      a.length,
    published:  a.filter(x => x.status === "published").length,
    draft:      a.filter(x => x.status === "draft").length,
    archived:   a.filter(x => x.status === "archived").length,
    breaking:   a.filter(x => x.breaking).length,
    totalViews: a.reduce((s, x) => s + (x.views || 0), 0),
    topArticles: [...a].sort((x, y) => y.views - x.views).slice(0, 5)
      .map(x => ({ id:x.id, headline:x.headline, views:x.views, status:x.status, category:x.category })),
    recent: a.slice(0, 8)
      .map(x => ({ id:x.id, headline:x.headline, status:x.status, createdAt:x.createdAt, category:x.category, byline:x.byline })),
  });
});

// ── PUBLIC API (no auth — used by the website) ────────────────
app.get("/api/public/articles", (req, res) => {
  const db = loadDB();
  const { category, limit = 100 } = req.query;
  let list = db.articles.filter(a => a.status === "published");
  if (category) list = list.filter(a => a.category === category);
  list.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  res.json(list.slice(0, +limit));
});

// GET single article — also increments views
app.get("/api/public/articles/:id", (req, res) => {
  const db  = loadDB();
  const idx = db.articles.findIndex(a => a.id === req.params.id && a.status === "published");
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  db.articles[idx].views = (db.articles[idx].views || 0) + 1;
  saveDB(db);
  res.json(db.articles[idx]);
});

// POST view increment (called by website when article is opened)
app.post("/api/public/articles/:id/view", (req, res) => {
  const db  = loadDB();
  const idx = db.articles.findIndex(a => a.id === req.params.id && a.status === "published");
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  db.articles[idx].views = (db.articles[idx].views || 0) + 1;
  saveDB(db);
  res.json({ views: db.articles[idx].views });
});

// GET view count only (for polling)
app.get("/api/public/articles/:id/views", (req, res) => {
  const db  = loadDB();
  const a   = db.articles.find(a => a.id === req.params.id && a.status === "published");
  if (!a) return res.status(404).json({ error: "Not found" });
  res.json({ views: a.views || 0 });
});

app.get("/api/categories",      (req, res) => res.json(loadDB().categories));
app.get("/api/topics",          (req, res) => res.json(loadDB().topics));
app.get("/api/content-buckets", auth, (req, res) => res.json(loadDB().contentBuckets));

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ── START ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  // Auto-reset if db.json has invalid passwords
  loadDB();
  console.log(`\n✅  Backend running: http://localhost:${PORT}`);
  console.log(`\n👤  Login credentials:`);
  console.log(`    Admin:         admin@mu.in   / admin123`);
  console.log(`    Amruta Jadhav: amruta@mu.in  / pass123`);
  console.log(`    demo_user:     demo@mu.in    / demo123`);
  console.log(`\n🔄  To reset DB: POST http://localhost:${PORT}/api/dev/reset-db`);
  console.log(`    Or: delete db.json and restart the server\n`);
});
