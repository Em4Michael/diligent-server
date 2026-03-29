require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");

const authRoutes     = require("./routes/auth");
const profileRoutes  = require("./routes/profile");
const documentRoutes = require("./routes/documents");

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────
// Accepts any origin in development; in production set CLIENT_URL in
// your Render environment variables to your frontend URL.
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, curl, mobile apps)
      if (!origin) return callback(null, true);

      // In production, CLIENT_URL must be set (e.g. https://your-frontend.onrender.com)
      // In development we allow localhost / 127.0.0.1 on any port
      const allowedPatterns = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      ];

      const explicitAllowed = (process.env.CLIENT_URL || "")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      const isPattern = allowedPatterns.some((r) => r.test(origin));
      const isExplicit = explicitAllowed.includes(origin);

      if (isPattern || isExplicit) return callback(null, origin);

      console.warn("CORS blocked:", origin);
      return callback(new Error("CORS: origin not allowed → " + origin));
    },
    credentials: true,
  })
);

// ── BODY PARSING ─────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API ROUTES ────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/profile",   profileRoutes);
app.use("/api/documents", documentRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Diligent Supports API running" });
});

// ── ROOT ─────────────────────────────────────────────────────────────
// The frontend is a separate app/repo — no static serving needed here.
app.get("/", (req, res) => {
  res.json({ message: "Diligent Supports API", version: "1.0.0" });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ── CONNECT & START ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running → http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
