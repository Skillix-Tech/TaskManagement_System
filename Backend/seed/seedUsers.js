const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/User");

// ============================================
// COMMON PASSWORD
// ============================================

const COMMON_PASSWORD = "Skillix@123";

// ============================================
// USERS
// Replace ONLY the email addresses below
// ============================================

const users = [
  // ==========================================
  // ADMINS - 2
  // ==========================================

  {
    name: "Bala",
    email: "balasubdo@gmail.com",
    role: "admin",
  },

  {
    name: "Jivvitesh",
    email: "jivviteshofficial@gmail.com",
    role: "admin",
  },

  // ==========================================
  // MEMBERS - 10
  // ==========================================

  {
    name: "Anbu",
    email: "anbuv925@gmail.com",
    role: "member",
  },

  {
    name: "Karthi",
    email: "karthikeyansn52@gmail.com",
    role: "member",
  },

  {
    name: "Johan",
    email: "johanmanova15@gmail.com",
    role: "member",
  },

  {
    name: "Durgesh",
    email: "skdurgesh2006@gmail.com",
    role: "member",
  },

  {
    name: "Joshua",
    email: "joshua.krait@gmail.com",
    role: "member",
  },

  {
    name: "Ashwin",
    email: "ashwin2007pm@gmail.com",
    role: "member",
  },

  {
    name: "Srihari",
    email: "sriharicbe07@gmail.com",
    role: "member",
  },

  {
    name: "Marooshini",
    email: "marushiniravi6038@gmail.com",
    role: "member",
  },

  {
    name: "Janani",
    email: "jananishankar0519@gmail.com",
    role: "member",
  },

  {
    name: "Arjun",
    email: "arjunsnair2007@gmail.com",
    role: "member",
  },
];

// ============================================
// SEED FUNCTION
// ============================================

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    // Hash common password ONCE
    const hashedPassword = await bcrypt.hash(
      COMMON_PASSWORD,
      10
    );

    console.log("Password hashed successfully.");

    // ==========================================
    // CREATE USERS
    // ==========================================

    for (const user of users) {

      // Check whether email already exists
      const existingUser = await User.findOne({
        email: user.email,
      });

      if (existingUser) {
        console.log(
          `User already exists: ${user.email}`
        );

        continue;
      }

      // Create user
      await User.create({
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        avatar: "",
        isActive: true,
      });

      console.log(
        `Created ${user.role}: ${user.email}`
      );
    }

    console.log("");
    console.log("====================================");
    console.log("USER SEEDING COMPLETED");
    console.log("====================================");
    console.log(`Total users: ${users.length}`);
    console.log("Admins: 2");
    console.log("Members: 10");
    console.log("Common password: Skillix@123");
    console.log("====================================");

  } catch (error) {

    console.error(
      "Error while seeding users:",
      error
    );

  } finally {

    await mongoose.connection.close();

    console.log("MongoDB connection closed.");

    process.exit(0);
  }
};

// Run
seedUsers();