const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// MIDDLEWARE
// ================================
app.use(cors());
app.use(express.json());


// ================================
// MONGODB CONNECTION
// ================================
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully ✅");
    })
    .catch((error) => {
        console.log("MongoDB Connection Failed ❌");
        console.log(error);
    });


// ================================
// USER MODEL
// ================================
const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true
        },

        password: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", UserSchema);


// ================================
// HOME API
// ================================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "MK Web Backend is Running 🚀"
    });
});


// ================================
// TEST API
// ================================
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Frontend successfully connected with Backend 🎉",
        server: "MK Web",
        status: "Online"
    });
});


// ================================
// REGISTER API
// ================================
app.post("/api/register", async (req, res) => {

    try {

        const { username, password } = req.body;

        // Check empty fields
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }


        // Check if user already exists
        const existingUser = await User.findOne({
            username: username
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username already exists"
            });
        }


        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);


        // Create new user
        const newUser = new User({
            username: username,
            password: hashedPassword
        });


        // Save user to MongoDB
        await newUser.save();


        res.status(201).json({
            success: true,
            message: "User registered successfully 🎉"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ================================
// LOGIN API
// ================================
app.post("/api/login", async (req, res) => {

    try {

        const { username, password } = req.body;


        // Find user
        const user = await User.findOne({
            username: username
        });


        // User not found
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }


        // Check password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );


        // Wrong password
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }


        // Login successful
        res.json({
            success: true,
            message: "Login successful 🎉",
            username: user.username
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ================================
// START SERVER
// ================================
app.listen(PORT, () => {

    console.log(
        `MK Web Backend running on port ${PORT}`
    );

});
