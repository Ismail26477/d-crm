import express from "express"
import Caller from "../models/Caller.js"
import mongoose from "mongoose"

const router = express.Router()

// Mock user data for testing when MongoDB is unavailable
const MOCK_USERS = {
  "admin@gmail.com": {
    id: "admin-001",
    username: "admin",
    name: "Administrator",
    email: "admin@gmail.com",
    phone: "+1234567890",
    role: "admin",
    status: "active",
    password: "admin123",
  },
  "caller@gmail.com": {
    id: "caller-001",
    username: "caller",
    name: "Sales Caller",
    email: "caller@gmail.com",
    phone: "+0987654321",
    role: "caller",
    status: "active",
    password: "caller123",
  },
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    console.log("[v0] Login attempt for:", email)

    let caller = null
    let isDbConnected = mongoose.connection.readyState === 1

    // Try database first if connected
    if (isDbConnected) {
      try {
        caller = await Caller.findOne({ email: email })

        if (!caller) {
          console.log("[v0] Email not found, trying username:", email)
          caller = await Caller.findOne({ username: email })
        }
      } catch (dbError) {
        console.warn("[v0] Database query failed:", dbError.message)
        isDbConnected = false
      }
    }

    // Fallback to mock data if no database connection or user not found
    if (!caller) {
      console.log("[v0] Database unavailable or user not found, checking mock data")
      const mockUser = MOCK_USERS[email.toLowerCase()]

      if (mockUser) {
        console.log("[v0] Using mock user for:", email)
        // Verify password against mock user
        if (mockUser.password !== password) {
          console.log("[v0] Password mismatch for user:", email)
          return res.status(401).json({ message: "Invalid credentials" })
        }

        console.log("[v0] Mock login successful for:", email)
        return res.json({
          id: mockUser.id,
          username: mockUser.username,
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          role: mockUser.role,
          status: mockUser.status,
        })
      }

      console.log("[v0] No user found with email:", email)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Real database user - verify password
    if (caller.password !== password) {
      console.log("[v0] Password mismatch for user:", email)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    console.log("[v0] Login successful for:", email)

    res.json({
      id: caller._id,
      username: caller.username,
      name: caller.name,
      email: caller.email,
      phone: caller.phone,
      role: caller.role,
      status: caller.status,
    })
  } catch (error) {
    console.error("[v0] Login error:", error.message)
    console.error("[v0] Error stack:", error.stack)
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    })
  }
})

export default router
