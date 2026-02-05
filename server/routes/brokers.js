import express from "express"
import Broker from "../models/Broker.js"
import Lead from "../models/Lead.js"

const router = express.Router()

// Get all brokers
router.get("/", async (req, res) => {
  try {
    const brokers = await Broker.find().populate("assignedLeads")
    res.json(brokers)
  } catch (error) { 
    res.status(500).json({ error: "Failed to fetch brokers", details: error.message })
  }
})

// Get broker leads
router.get("/:id/leads", async (req, res) => {
  try {
    const leads = await Lead.find({ assignedBroker: req.params.id })
    res.json(leads)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch broker leads", details: error.message })
  }
})

// Get single broker by ID
router.get("/:id", async (req, res) => {
  try {
    const broker = await Broker.findById(req.params.id).populate("assignedLeads")
    if (!broker) {
      return res.status(404).json({ error: "Broker not found" })
    }
    res.json(broker)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch broker", details: error.message })
  }
})

// Create a new broker
router.post("/", async (req, res) => {
  try {
    const broker = new Broker(req.body)
    await broker.save()
    res.status(201).json(broker)
  } catch (error) {
    res.status(400).json({ error: "Failed to create broker", details: error.message })
  }
})

// Update broker
router.put("/:id", async (req, res) => {
  try {
    const broker = await Broker.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("assignedLeads")
    if (!broker) {
      return res.status(404).json({ error: "Broker not found" })
    }
    res.json(broker)
  } catch (error) {
    res.status(400).json({ error: "Failed to update broker", details: error.message })
  }
})

// Delete broker
router.delete("/:id", async (req, res) => {
  try {
    const broker = await Broker.findByIdAndDelete(req.params.id)
    if (!broker) {
      return res.status(404).json({ error: "Broker not found" })
    }
    res.json({ message: "Broker deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete broker", details: error.message })
  }
})

// Assign leads to broker
router.post("/:id/assign-leads", async (req, res) => {
  try {
    const { leadIds } = req.body
    const broker = await Broker.findByIdAndUpdate(
      req.params.id,
      { assignedLeads: leadIds },
      { new: true },
    ).populate("assignedLeads")
    res.json(broker)
  } catch (error) {
    res.status(400).json({ error: "Failed to assign leads", details: error.message })
  }
})

export default router
