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
            unique: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        bio: {
            type: String,
            default: "Hello! I'm using MK Chat"
        },

        profile: {
            type: String,
            default: "👤"
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", UserSchema);


// ================================
// MESSAGE MODEL
// ================================
const MessageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },

        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },

        text: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Message = mongoose.model("Message", MessageSchema);


// ================================
// HOME API
// ================================
app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "MK Chat Backend is Running 🚀"
    });

});


// ================================
// TEST API
// ================================
app.get("/api/test", (req, res) => {

    res.json({
        success: true,
        message: "MK Chat Frontend successfully connected 🎉",
        server: "MK Chat",
        status: "Online"
    });

});


// ================================
// REGISTER API
// ================================
app.post("/api/register", async (req, res) => {

    try {

        const {
            username,
            email,
            password
        } = req.body;


        // Check empty fields
        if (!username || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });

        }


        // Check existing username
        const existingUsername = await User.findOne({
            username: username
        });

        if (existingUsername) {

            return res.status(400).json({
                success: false,
                message: "Username already exists"
            });

        }


        // Check existing email
        const existingEmail = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingEmail) {

            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });

        }


        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // Create new user
        const newUser = new User({

            username: username,

            email: email.toLowerCase(),

            password: hashedPassword,

            bio: "Hello! I'm using MK Chat",

            profile: "👤"

        });


        // Save user
        await newUser.save();


        res.status(201).json({

            success: true,

            message: "Account Created Successfully 🎉",

            user: {

                id: newUser._id,

                username: newUser.username,

                email: newUser.email,

                bio: newUser.bio,

                profile: newUser.profile

            }

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

        const {
            email,
            password
        } = req.body;


        // Check empty fields
        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message: "Email and password are required"

            });

        }


        // Find user
        const user = await User.findOne({

            email: email.toLowerCase()

        });


        // User not found
        if (!user) {

            return res.status(401).json({

                success: false,

                message: "Invalid Email or Password"

            });

        }


        // Check password
        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        // Wrong password
        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message: "Invalid Email or Password"

            });

        }


        // Login successful
        res.json({

            success: true,

            message: "Login successful 🎉",

            user: {

                id: user._id,

                username: user.username,

                email: user.email,

                bio: user.bio,

                profile: user.profile

            }

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
// SEARCH USERS API
// ================================
app.get("/api/users", async (req, res) => {

    try {

        const search =
            req.query.search || "";


        const users = await User.find({

            username: {

                $regex: search,

                $options: "i"

            }

        })
        .select(
            "_id username email bio profile"
        )
        .limit(50);


        res.json({

            success: true,

            users: users

        });


    } catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: "Unable to fetch users"

        });

    }

});


// ================================
// SEND MESSAGE API
// ================================
app.post("/api/messages", async (req, res) => {

    try {

        const {
            senderId,
            receiverId,
            text
        } = req.body;


        // Check required fields
        if (
            !senderId ||
            !receiverId ||
            !text
        ) {

            return res.status(400).json({

                success: false,

                message: "Message information missing"

            });

        }


        // Create message
        const newMessage =
            new Message({

                senderId: senderId,

                receiverId: receiverId,

                text: text

            });


        // Save message
        await newMessage.save();


        res.status(201).json({

            success: true,

            message: newMessage

        });


    } catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: "Message could not be sent"

        });

    }

});


// ================================
// GET CHAT MESSAGES API
// ================================
app.get(
    "/api/messages/:user1/:user2",
    async (req, res) => {

        try {

            const {
                user1,
                user2
            } = req.params;


            const messages =
                await Message.find({

                    $or: [

                        {
                            senderId: user1,

                            receiverId: user2

                        },

                        {
                            senderId: user2,

                            receiverId: user1

                        }

                    ]

                })
                .sort({
                    createdAt: 1
                });


            res.json({

                success: true,

                messages: messages

            });


        } catch (error) {

            console.log(error);

            res.status(500).json({

                success: false,

                message: "Messages could not be loaded"

            });

        }

    }
);


// ================================
// DELETE SINGLE MESSAGE API
// ================================
app.delete(
    "/api/messages/:messageId",
    async (req, res) => {

        try {

            const {
                messageId
            } = req.params;


            const deletedMessage =
                await Message.findByIdAndDelete(
                    messageId
                );


            if (!deletedMessage) {

                return res.status(404).json({

                    success: false,

                    message: "Message not found"

                });

            }


            res.json({

                success: true,

                message: "Message deleted successfully"

            });


        } catch (error) {

            console.log(error);

            res.status(500).json({

                success: false,

                message: "Message could not be deleted"

            });

        }

    }
);


// ================================
// PERMANENTLY DELETE ACCOUNT API
// ================================
app.delete(
    "/api/users/:userId",
    async (req, res) => {

        try {

            const {
                userId
            } = req.params;

            const {
                password
            } = req.body;


            // Password required
            if (!password) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password is required to delete account"

                });

            }


            // Find user
            const user =
                await User.findById(userId);


            // User not found
            if (!user) {

                return res.status(404).json({

                    success: false,

                    message: "User not found"

                });

            }


            // Verify password
            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );


            // Wrong password
            if (!passwordMatch) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Incorrect password"

                });

            }


            // Delete all messages
            // sent OR received by this user
            await Message.deleteMany({

                $or: [

                    {
                        senderId: userId
                    },

                    {
                        receiverId: userId
                    }

                ]

            });


            // Delete user
            await User.findByIdAndDelete(
                userId
            );


            // Success
            res.json({

                success: true,

                message:
                    "Account permanently deleted"

            });


        } catch (error) {

            console.log(error);

            res.status(500).json({

                success: false,

                message:
                    "Account could not be deleted"

            });

        }

    }
);


// ================================
// START SERVER
// ================================
app.listen(
    PORT,
    () => {

        console.log(
            `MK Chat Backend running on port ${PORT}`
        );

    }
);
