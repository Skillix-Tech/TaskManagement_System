const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const memberRoutes = require("./routes/memberRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// ===============================
// Middleware
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// Serve Frontend
// ===============================

app.use(
    express.static(
        path.join(__dirname, "../Frontend")
    )
);

// ===============================
// Database
// ===============================

connectDB();

// ===============================
// API Routes
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/member", memberRoutes);

// ===============================
// Login Page
// ===============================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../Frontend/index.html")
    );
});

// ===============================
// Server
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});