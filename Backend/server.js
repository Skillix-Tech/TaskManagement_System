const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const memberRoutes = require("./routes/memberRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Serve Frontend files
app.use(express.static(path.join(__dirname, "../Frontend")));

// Connect MongoDB
connectDB();

// Login / Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

app.use("/api/member", memberRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});