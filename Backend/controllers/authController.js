const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");


// ==========================================
// LOGIN
// ==========================================

const login = async (req, res) => {

    try {

        const {
            email,
            password,
            role
        } = req.body;


        // Check required fields
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Email, password and role are required"
            });
        }


        // Check valid role
        if (!["admin", "member"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }


        // Find user
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });


        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        // Check role
        if (user.role !== role) {
            return res.status(403).json({
                message: "You selected the wrong login type"
            });
        }


        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );


        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        // Create JWT
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );


        // Send response
        res.status(200).json({
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });


    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    login
};