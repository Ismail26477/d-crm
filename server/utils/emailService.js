import nodemailer from "nodemailer"
import Settings from "../models/Settings.js"

// Create and send email notification
export async function sendEmailNotification(to, subject, html) {
  try {
    // Get settings from database
    const settings = await Settings.findOne({ type: "global" })

    if (!settings || !settings.emailConfig.enableNotifications) {
      console.log("[v0] Email notifications are disabled")
      return { success: false, message: "Email notifications disabled" }
    }

    const { smtpServer, smtpPort, senderEmail, senderPassword } = settings.emailConfig

    // Validate email configuration
    if (!smtpServer || !smtpPort || !senderEmail || !senderPassword) {
      console.log("[v0] Email configuration incomplete")
      return { success: false, message: "Email configuration incomplete" }
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpServer,
      port: Number.parseInt(smtpPort),
      secure: smtpPort === "465", // true for 465, false for other ports
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"CRM System" <${senderEmail}>`,
      to,
      subject,
      html,
    })

    console.log("[v0] Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return { success: false, error: error.message }
  }
}

// Send lead assignment notification
export async function sendLeadAssignmentEmail(callerEmail, callerName, leadData) {
  const settings = await Settings.findOne({ type: "global" })

  if (!settings || !settings.emailConfig.notifyOnAssignment) {
    console.log("[v0] Lead assignment notifications are disabled")
    return
  }

  const subject = "New Lead Assigned to You"
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${callerName},</h2>
      <p>A new lead has been assigned to you:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Name:</strong> ${leadData.name}</p>
        <p><strong>Phone:</strong> ${leadData.phone}</p>
        ${leadData.email ? `<p><strong>Email:</strong> ${leadData.email}</p>` : ""}
        ${leadData.city ? `<p><strong>City:</strong> ${leadData.city}</p>` : ""}
        <p><strong>Source:</strong> ${leadData.source}</p>
        <p><strong>Priority:</strong> ${leadData.priority}</p>
        ${leadData.notes ? `<p><strong>Notes:</strong> ${leadData.notes}</p>` : ""}
      </div>
      <p>Please follow up with this lead as soon as possible.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated notification from your CRM system.</p>
    </div>
  `

  return await sendEmailNotification(callerEmail, subject, html)
}

// Send stage change notification
export async function sendStageChangeEmail(callerEmail, callerName, leadData, oldStage, newStage) {
  const settings = await Settings.findOne({ type: "global" })

  if (!settings || !settings.emailConfig.notifyOnStageChange) {
    console.log("[v0] Stage change notifications are disabled")
    return
  }

  const subject = `Lead Stage Updated: ${leadData.name}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${callerName},</h2>
      <p>The stage of lead <strong>${leadData.name}</strong> has been updated:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Old Stage:</strong> ${oldStage}</p>
        <p><strong>New Stage:</strong> ${newStage}</p>
        <p><strong>Lead Name:</strong> ${leadData.name}</p>
        <p><strong>Phone:</strong> ${leadData.phone}</p>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated notification from your CRM system.</p>
    </div>
  `

  return await sendEmailNotification(callerEmail, subject, html)
}
