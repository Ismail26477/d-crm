import express from "express"
import Lead from "../models/Lead.js"
import Activity from "../models/Activity.js"
import { autoAssignLead } from "../utils/leadAssignment.js"
import { sendLeadAssignmentEmail, sendStageChangeEmail } from "../utils/emailService.js"
import Caller from "../models/Caller.js"

const router = express.Router()

// Get all leads
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 })

    // Transform to match frontend format
    const formattedLeads = leads.map((lead) => ({
      id: lead._id.toString(),
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      value: lead.value,
      source: lead.source,
      stage: lead.stage,
      priority: lead.priority,
      status: lead.status,
      category: lead.category,
      subcategory: lead.subcategory,
      assignedCaller: lead.assignedCaller?.toString(),
      assignedCallerName: lead.assignedCallerName,
      assignedBroker: lead.assignedBroker?.toString(),
      assignedBrokerName: lead.assignedBrokerName,
      projectName: lead.projectName,
      nextFollowUp: lead.nextFollowUp,
      followUpReason: lead.followUpReason,
      notes: lead.notes,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }))

    res.json(formattedLeads)
  } catch (error) {
    res.status(500).json({ message: "Error fetching leads", error: error.message })
  }
})

// Create new lead
router.post("/", async (req, res) => {
  try {
    const leadData = { ...req.body }
    delete leadData.id

    const assignmentResult = await autoAssignLead()

    if (assignmentResult) {
      leadData.assignedCaller = assignmentResult.callerId
      leadData.assignedCallerName = assignmentResult.callerName
    } else if (!leadData.assignedCaller || leadData.assignedCaller === "unassigned") {
      delete leadData.assignedCaller
      delete leadData.assignedCallerName
    }

    // Handle broker assignment - remove if not provided or marked as unassigned
    if (!leadData.assignedBroker || leadData.assignedBroker === "unassigned" || leadData.assignedBroker === "") {
      delete leadData.assignedBroker
      delete leadData.assignedBrokerName
    }

    const lead = new Lead(leadData)
    await lead.save()



    if (assignmentResult) {
      try {
        await sendLeadAssignmentEmail(assignmentResult.callerEmail, assignmentResult.callerName, {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          city: lead.city,
          source: lead.source,
          priority: lead.priority,
          notes: lead.notes,
        })
      } catch (emailError) {
        console.error("[v0] Error sending assignment email:", emailError)
      }
    }

    const activity = new Activity({
      leadId: lead._id,
      type: "created",
      description: assignmentResult
        ? `New lead created and assigned to ${assignmentResult.callerName}`
        : "New lead created",
      userName: "System",
    })
    await activity.save()

    const leadObj = lead.toObject()
    res.status(201).json({
      id: lead._id.toString(),
      name: leadObj.name,
      phone: leadObj.phone,
      email: leadObj.email,
      city: leadObj.city,
      value: leadObj.value,
      source: leadObj.source,
      stage: leadObj.stage,
      priority: leadObj.priority,
      status: leadObj.status,
      category: leadObj.category,
      subcategory: leadObj.subcategory,
      assignedCaller: leadObj.assignedCaller?.toString(),
      assignedCallerName: leadObj.assignedCallerName,
      assignedBroker: leadObj.assignedBroker?.toString(),
      assignedBrokerName: leadObj.assignedBrokerName,
      projectName: leadObj.projectName,
      nextFollowUp: leadObj.nextFollowUp,
      followUpReason: leadObj.followUpReason,
      notes: leadObj.notes,
      createdAt: leadObj.createdAt,
      updatedAt: leadObj.updatedAt,
    })
  } catch (error) {
    console.error("[v0] Error creating lead:", error)
    res.status(500).json({ message: "Error creating lead", error: error.message })
  }
})

// Merge duplicate leads - keep one and delete others
router.post("/merge-duplicates", async (req, res) => {
  try {
    const { duplicateIds, keepId } = req.body

    if (!duplicateIds || !Array.isArray(duplicateIds) || !keepId) {
      return res.status(400).json({ message: "Invalid request: duplicateIds and keepId are required" })
    }

    console.log("[v0] Merging duplicates. Keeping:", keepId, "Deleting:", duplicateIds)

    // Get the lead to keep
    const leadToKeep = await Lead.findById(keepId)
    if (!leadToKeep) {
      return res.status(404).json({ message: "Lead to keep not found" })
    }

    // Delete duplicate leads
    const deleteResult = await Lead.deleteMany({
      _id: { $in: duplicateIds },
    })

    console.log("[v0] Deleted", deleteResult.deletedCount, "duplicate leads")

    // Create activity log for the merge
    const activity = new Activity({
      leadId: leadToKeep._id,
      type: "merged",
      description: `Merged ${deleteResult.deletedCount} duplicate lead(s) into this lead`,
      userName: "System",
    })
    await activity.save()

    res.json({
      message: `Successfully merged ${deleteResult.deletedCount} duplicate lead(s)`,
      mergedCount: deleteResult.deletedCount,
      keepId,
    })
  } catch (error) {
    console.error("[v0] Error merging duplicates:", error)
    res.status(500).json({ message: "Error merging duplicates", error: error.message })
  }
})

// Update lead
router.put("/:id", async (req, res) => {
  try {
    const oldLead = await Lead.findById(req.params.id)

    if (!oldLead) {
      return res.status(404).json({ message: "Lead not found" })
    }

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true })

    if (oldLead.stage !== lead.stage && lead.assignedCaller) {
      try {
        const caller = await Caller.findById(lead.assignedCaller)
        if (caller) {
          await sendStageChangeEmail(
            caller.email,
            caller.name,
            {
              name: lead.name,
              phone: lead.phone,
            },
            oldLead.stage,
            lead.stage,
          )
        }
      } catch (emailError) {
        console.error("[v0] Error sending stage change email:", emailError)
      }
    }

    res.json({
      id: lead._id.toString(),
      ...lead.toObject(),
    })
  } catch (error) {
    res.status(500).json({ message: "Error updating lead", error: error.message })
  }
})

// Delete lead
router.delete("/:id", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id)

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" })
    }

    res.json({ message: "Lead deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting lead", error: error.message })
  }
})

export default router
