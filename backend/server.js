const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

let db;

// ================= SQLITE CONNECTION =================
const connectDB = async () => {
  try {
    db = await open({
      filename: './users.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
    console.log("✅ SQLite Database Connected and Initialized Successfully");
  } catch (err) {
    console.error("❌ Failed to connect to SQLite:", err);
  }
};

connectDB();

// ================= SIGNUP API =================
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await db.get("SELECT * FROM users WHERE email = ?", [email]);

    if (existingUser) {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    await db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, password]);

    res.json({
      success: true,
      message: "Signup successful"
    });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// ================= LOGIN API =================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid email or password"
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// ================= RESET PASSWORD API =================
app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);

    if (!user) {
      return res.json({
        success: false,
        message: "Email not found"
      });
    }

    await db.run("UPDATE users SET password = ? WHERE email = ?", [newPassword, email]);

    res.json({
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// ================= START SERVER =================
app.listen(5000, () => {
  console.log("Server running on port 5000");
});