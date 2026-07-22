const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Home API
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "MK Web Backend is Running 🚀"
    });
});

// Test API
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Frontend successfully connected with Backend 🎉",
        server: "MK Web",
        status: "Online"
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`MK Web Backend running on port ${PORT}`);
});
