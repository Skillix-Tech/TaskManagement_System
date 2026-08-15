const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const memberRoutes = require("./routes/memberRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../Frontend")));

connectDB();

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"../Frontend/index.html"));
});

// Authentication
app.use("/api/auth", authRoutes);

// Member
app.use("/api/member", memberRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});