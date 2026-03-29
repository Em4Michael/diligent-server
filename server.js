require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const documentRoutes = require("./routes/documents");

const app = express();

// ── TRUST PROXY (Important for Render.com) ─────────────────────────────
app.set('trust proxy', 1);   // ← This often fixes 401 / cookie / header issues on Render

// ── CORS (Improved for production + Render) ────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const allowedPatterns = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        /^https:\/\/.*\.vercel\.app$/,
        /^https:\/\/.*\.onrender\.com$/,
      ];

      const extraOrigins = (process.env.CLIENT_URL || "")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      const isAllowed =
        allowedPatterns.some((regex) => regex.test(origin)) ||
        extraOrigins.includes(origin);

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);
      callback(new Error(`CORS: Origin not allowed → ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    optionsSuccessStatus: 204,
  })
);

// Handle preflight requests explicitly
app.options("*", cors());

// ── BODY PARSING ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API ROUTES ────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/documents", documentRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", message: "Diligent Supports API" })
);

app.get("/", (_req, res) =>
  res.json({ message: "Diligent Supports API", version: "1.0.0" })
);

// ── GLOBAL ERROR HANDLER (Improved logging) ───────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", {
    message: err.message,
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ── START SERVER ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "production"}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });