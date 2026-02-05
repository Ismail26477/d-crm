import express from "express"
import FollowUp from "../models/FollowUp.js"
import Lead from "../models/Lead.js"
import Activity from "../models/Activity.js"

const router = express.Router()

// Get all follow-ups (paginated and with lead data)
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const skip = parseInt(req.query.skip) || 0

    console.log("[v0] Fetching follow-ups with limit:", limit, "skip:", skip)

    const followUps = await FollowUp.find()
      .populate("leadId", "name phone email")
      .sort({ scheduledFor: -1 })
      .limit(limit)
      .skip(skip)

    console.log("[v0] Found follow-ups:", followUps.length)

    const formatted = followUps.map((fu) => {
      console.log("[v0] Processing follow-up:", {
        id: fu._id,
        leadId: fu.leadId,
        scheduledFor: fu.scheduledFor,
        status: fu.status,
      })

      return {
        id: fu._id.toString(),
        leadId: fu.leadId?._id?.toString() || fu.leadId?.toString() || "unknown",
        leadName: fu.leadId?.name || "Unknown",
        leadPhone: fu.leadId?.phone || "",
        leadEmail: fu.leadId?.email || "",
        scheduledFor: fu.scheduledFor,
        reason: fu.reason,
        status: fu.status,
        type: fu.type,
        notes: fu.notes,
        createdByName: fu.createdByName,
        completedAt: fu.completedAt,
        completedNotes: fu.completedNotes,
        reminderSent: fu.reminderSent,
        outcome: fu.outcome,
        createdAt: fu.createdAt,
        updatedAt: fu.updatedAt,
      }
    })

    console.log("[v0] Returning formatted follow-ups:", formatted.length)
    res.json(formatted)
  } catch (error) {
    console.error("[v0] Error fetching follow-ups:", error)
    res.status(500).json({ message: "Error fetching follow-ups", error: error.message })
  }
})

// Get all follow-ups for a lead
router.get("/lead/:leadId", async (req, res) => {
  try {
    const followUps = await FollowUp.find({ leadId: req.params.leadId })
      .sort({ scheduledFor: -1 })
      .populate("createdBy", "name email")

    const formatted = followUps.map((fu) => ({
      id: fu._id.toString(),
      leadId: fu.leadId.toString(),
      scheduledFor: fu.scheduledFor,
      reason: fu.reason,
      status: fu.status,
      type: fu.type,
      notes: fu.notes,
      createdBy: fu.createdBy?.toString(),
      createdByName: fu.createdByName,
      completedAt: fu.completedAt,
      completedNotes: fu.completedNotes,
      reminderSent: fu.reminderSent,
      outcome: fu.outcome,
      createdAt: fu.createdAt,
      updatedAt: fu.updatedAt,
    }))

    res.json(formatted)
  } catch (error) {
    console.error("[v0] Error fetching follow-ups:", error)
    res.status(500).json({ message: "Error fetching follow-ups", error: error.message })
  }
})

// Get pending follow-ups (for dashboard)
router.get("/pending/dashboard", async (req, res) => {
  try {
    const now = new Date()
    const pendingFollowUps = await FollowUp.find({
      status: "pending",
      scheduledFor: { $lte: now },
    })
      .populate("leadId", "name phone email")
      .sort({ scheduledFor: 1 })

    const formatted = pendingFollowUps.map((fu) => ({
      id: fu._id.toString(),
      leadId: fu.leadId._id.toString(),
      leadName: fu.leadId.name,
      leadPhone: fu.leadId.phone,
      scheduledFor: fu.scheduledFor,
      reason: fu.reason,
      type: fu.type,
      notes: fu.notes,
    }))

    res.json(formatted)
  } catch (error) {
    console.error("[v0] Error fetching pending follow-ups:", error)
    res.status(500).json({ message: "Error fetching pending follow-ups", error: error.message })
  }
})

// Create new follow-up
router.post("/", async (req, res) => {
  try {
    console.log("[v0] ===== CREATING FOLLOW-UP =====")
    const { leadId, scheduledFor, reason, type, notes, createdByName } = req.body

    console.log("[v0] Received follow-up data:", {
      leadId,
      scheduledFor,
      reason,
      type,
      notes,
      createdByName,
    })

    if (!leadId || !scheduledFor) {
      console.error("[v0] Missing required fields")
      return res.status(400).json({ message: "Missing required fields: leadId and scheduledFor" })
    }

    // Validate lead exists
    console.log("[v0] Checking if lead exists with ID:", leadId)
    const lead = await Lead.findById(leadId)
    if (!lead) {
      console.error("[v0] Lead not found:", leadId)
      return res.status(404).json({ message: "Lead not found" })
    }

    console.log("[v0] Lead found:", lead.name)

    const scheduledDate = new Date(scheduledFor)
    if (isNaN(scheduledDate.getTime())) {
      console.error("[v0] Invalid date:", scheduledFor)
      return res.status(400).json({ message: "Invalid date format for scheduledFor" })
    }

    console.log("[v0] Scheduled date parsed:", scheduledDate)

    // Create follow-up
    const followUp = new FollowUp({
      leadId,
      scheduledFor: scheduledDate,
      reason: reason || "custom",
      type: type || "call",
      notes: notes || "",
      createdByName: createdByName || "System",
    })

    console.log("[v0] Follow-up object created, saving to database...")
    await followUp.save()

    console.log("[v0] ✅ Follow-up saved successfully with ID:", followUp._id)

    // Update lead with next follow-up date
    console.log("[v0] Updating lead with next follow-up date...")
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      {
        nextFollowUp: scheduledDate,
        followUpReason: reason || "custom",
      },
      { new: true }
    )
    console.log("[v0] Lead updated:", updatedLead?.name)

    // Create activity
    console.log("[v0] Creating activity log...")
    const activity = new Activity({
      leadId,
      type: "follow_up_scheduled",
      description: `Follow-up scheduled for ${scheduledDate.toLocaleString()} - Reason: ${reason || "custom"}`,
      userName: createdByName || "System",
    })
    await activity.save()
    console.log("[v0] Activity created successfully")

    const responseData = {
      id: followUp._id.toString(),
      leadId: followUp.leadId.toString(),
      scheduledFor: followUp.scheduledFor,
      reason: followUp.reason,
      status: followUp.status,
      type: followUp.type,
      notes: followUp.notes,
      createdByName: followUp.createdByName,
      createdAt: followUp.createdAt,
      updatedAt: followUp.updatedAt,
    }

    console.log("[v0] ===== FOLLOW-UP CREATED SUCCESSFULLY =====")
    res.status(201).json(responseData)
  } catch (error) {
    console.error("[v0] ===== ERROR CREATING FOLLOW-UP =====")
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error stack:", error.stack)
    console.error("[v0] Full error:", error)
    res.status(500).json({ 
      message: "Error creating follow-up", 
      error: error.message, 
      stack: error.stack,
      type: error.name
    })
  }
})

// Mark follow-up as completed
router.put("/:id/complete", async (req, res) => {
  try {
    const { outcome, completedNotes } = req.body

    const followUp = await FollowUp.findByIdAndUpdate(
      req.params.id,
      {
        status: "completed",
        completedAt: new Date(),
        completedNotes,
        outcome,
      },
      { new: true },
    )

    if (!followUp) {
      return res.status(404).json({ message: "Follow-up not found" })
    }

    // Create activity
    const activity = new Activity({
      leadId: followUp.leadId,
      type: "follow_up_completed",
      description: `Follow-up completed - Outcome: ${outcome}`,
      userName: "System",
    })
    await activity.save()

    res.json({
      id: followUp._id.toString(),
      leadId: followUp.leadId.toString(),
      scheduledFor: followUp.scheduledFor,
      reason: followUp.reason,
      status: followUp.status,
      type: followUp.type,
      notes: followUp.notes,
      createdByName: followUp.createdByName,
      completedAt: followUp.completedAt,
      completedNotes: followUp.completedNotes,
      outcome: followUp.outcome,
      createdAt: followUp.createdAt,
      updatedAt: followUp.updatedAt,
    })
  } catch (error) {
    console.error("[v0] Error completing follow-up:", error)
    res.status(500).json({ message: "Error completing follow-up", error: error.message })
  }
})

// Cancel follow-up
router.put("/:id/cancel", async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndUpdate(req.params.id, { status: "cancelled" }, { new: true })

    if (!followUp) {
      return res.status(404).json({ message: "Follow-up not found" })
    }

    res.json({
      id: followUp._id.toString(),
      leadId: followUp.leadId.toString(),
      scheduledFor: followUp.scheduledFor,
      reason: followUp.reason,
      status: followUp.status,
      type: followUp.type,
      notes: followUp.notes,
      createdByName: followUp.createdByName,
      createdAt: followUp.createdAt,
      updatedAt: followUp.updatedAt,
    })
  } catch (error) {
    console.error("[v0] Error cancelling follow-up:", error)
    res.status(500).json({ message: "Error cancelling follow-up", error: error.message })
  }
})

// Mark reminder as sent
router.put("/:id/remind", async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndUpdate(
      req.params.id,
      {
        reminderSent: true,
        reminderSentAt: new Date(),
      },
      { new: true },
    )

    if (!followUp) {
      return res.status(404).json({ message: "Follow-up not found" })
    }

    res.json({
      id: followUp._id.toString(),
      leadId: followUp.leadId.toString(),
      scheduledFor: followUp.scheduledFor,
      reason: followUp.reason,
      status: followUp.status,
      type: followUp.type,
      notes: followUp.notes,
      createdByName: followUp.createdByName,
      reminderSent: followUp.reminderSent,
      reminderSentAt: followUp.reminderSentAt,
      createdAt: followUp.createdAt,
      updatedAt: followUp.updatedAt,
    })
  } catch (error) {
    console.error("[v0] Error sending reminder:", error)
    res.status(500).json({ message: "Error sending reminder", error: error.message })
  }
})

// Update follow-up (PATCH)
router.patch("/:id", async (req, res) => {
  try {
    const { status, notes, completedNotes, outcome } = req.body

    const updateData = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (completedNotes !== undefined) updateData.completedNotes = completedNotes
    if (outcome !== undefined) updateData.outcome = outcome

    if (status === "completed") {
      updateData.completedAt = new Date()
    }

    const followUp = await FollowUp.findByIdAndUpdate(req.params.id, updateData, { new: true })

    if (!followUp) {
      return res.status(404).json({ message: "Follow-up not found" })
    }

    res.json({
      id: followUp._id.toString(),
      leadId: followUp.leadId.toString(),
      scheduledFor: followUp.scheduledFor,
      reason: followUp.reason,
      status: followUp.status,
      type: followUp.type,
      notes: followUp.notes,
      createdByName: followUp.createdByName,
      completedAt: followUp.completedAt,
      completedNotes: followUp.completedNotes,
      outcome: followUp.outcome,
      createdAt: followUp.createdAt,
      updatedAt: followUp.updatedAt,
    })
  } catch (error) {
    console.error("[v0] Error updating follow-up:", error)
    res.status(500).json({ message: "Error updating follow-up", error: error.message })
  }
})

// Delete follow-up
router.delete("/:id", async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndDelete(req.params.id)

    if (!followUp) {
      return res.status(404).json({ message: "Follow-up not found" })
    }

    res.json({ message: "Follow-up deleted successfully", id: followUp._id.toString() })
  } catch (error) {
    console.error("[v0] Error deleting follow-up:", error)
    res.status(500).json({ message: "Error deleting follow-up", error: error.message })
  }
})

export default router
