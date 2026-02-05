import express from "express"
import Caller from "../models/Caller.js"

const router = express.Router()

// Get all callers
router.get("/", async (req, res) => {
  try {
    const callers = await Caller.find().select("-password")

    const formattedCallers = callers.map((caller) => ({
      id: caller._id.toString(),
      username: caller.username,
      name: caller.name,
      email: caller.email,
      phone: caller.phone,
      role: caller.role,
      status: caller.status,
      createdAt: caller.createdAt,
    }))

    res.json(formattedCallers)
  } catch (error) {
    res.status(500).json({ message: "Error fetching callers", error: error.message })
  }
})

// Create new caller
router.post("/", async (req, res) => {
  try {
    const caller = new Caller(req.body)
    await caller.save()

    const { password, ...callerData } = caller.toObject()

    res.status(201).json({
      id: caller._id.toString(),
      ...callerData,
    })
  } catch (error) {
    res.status(500).json({ message: "Error creating caller", error: error.message })
  }
})

export default router
