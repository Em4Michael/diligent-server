require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const documentRoutes = require("./routes/documents");

const app = express();

// ── CORE MIDDLEWARE ──────────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      const allowed = [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
      ];
      if (process.env.CLIENT_URL) allowed.push(process.env.CLIENT_URL);
      if (allowed.includes(origin)) return callback(null, origin);
      return callback(new Error("CORS: origin not allowed -> " + origin));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API ROUTES (must come BEFORE static serving) ─────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/documents", documentRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Diligent Supports API running" });
});

// ── STATIC FRONTEND (after API routes) ───────────────────────────────
app.use(express.static(path.join(__dirname, "../frontend/public")));

// SPA fallback — serve index.html for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

// ── GLOBAL ERROR HANDLER ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

// ── CONNECT MONGODB & START ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running → http://localhost:${PORT}`),
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
 