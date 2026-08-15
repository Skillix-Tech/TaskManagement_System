const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const login = async (req, res) => {

    try {

        const {
            email,
            password,
            role
        } = req.body;


        // ==========================================
        // VALIDATION
        // ==========================================

        if (!email || !password || !role) {

            return res.status(400).json({
                success: false,
                message:
                    "Email, password and role are required"
            });
        }


        // ==========================================
        // ROLE VALIDATION
        // ==========================================

        if (
            role !== "admin" &&
            role !== "member"
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }


        // ==========================================
        // FIND USER
        // ==========================================

        const user =
            await User.findOne({
                email:
                    email
                        .toLowerCase()
                        .trim()
            });


        if (!user) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }


        // ==========================================
        // CHECK ROLE
        // ==========================================

        if (user.role !== role) {

            return res.status(403).json({
                success: false,
                message:
                    "You selected the wrong login type"
            });
        }


        // ==========================================
        // CHECK ACTIVE
        // ==========================================

        if (!user.isActive) {

            return res.status(403).json({
                success: false,
                message:
                    "Your account is inactive"
            });
        }


        // ==========================================
        // PASSWORD
        // ==========================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }


        // ==========================================
        // JWT
        // ==========================================

        const token =
            jwt.sign(
                {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "1d"
                }
            );


        // ==========================================
        // SUCCESS
        // ==========================================

        res.status(200).json({

            success: true,

            message:
                "Login successful",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                role: user.role,

                avatar: user.avatar,

                isActive: user.isActive
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error"
        });
    }
};


module.exports = {
    login
};