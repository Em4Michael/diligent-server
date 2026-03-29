require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");

const authRoutes     = require("./routes/auth");
const profileRoutes  = require("./routes/profile");
const documentRoutes = require("./routes/documents");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      // No origin = Postman / curl / same-origin — always allow
      if (!origin) return callback(null, true);

      const allowed = [
        // Local dev
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        // Any Vercel deployment (preview + production)
        /^https:\/\/.*\.vercel\.app$/,
        // Any Render deployment
        /^https:\/\/.*\.onrender\.com$/,
      ];

      // Extra origins from env  e.g. CLIENT_URL=https://mycustomdomain.com
      const extras = (process.env.CLIENT_URL || "")
        .split(",").map(u => u.trim()).filter(Boolean);

      const ok = allowed.some(r => r.test(origin)) || extras.includes(origin);
      if (ok) return callback(null, origin);

      console.warn("CORS blocked:", origin);
      callback(new Error("CORS: origin not allowed → " + origin));
    },
    credentials: true,
  })
);

// ── BODY PARSING ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API ROUTES ────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/profile",   profileRoutes);
app.use("/api/documents", documentRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", message: "Diligent Supports API" })
);

app.get("/", (_req, res) =>
  res.json({ message: "Diligent Supports API", version: "1.0.0" })
);

// ── ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("❌", err.message);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

// ── START ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
  })
  .catch(err => { console.error("❌ MongoDB:", err.message); process.exit(1); });
