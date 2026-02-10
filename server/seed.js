import mongoose from "mongoose"
import dotenv from "dotenv"
import Lead from "./models/Lead.js"
import Caller from "./models/Caller.js"
import Activity from "./models/Activity.js"
import CallLog from "./models/CallLog.js"
import Broker from "./models/Broker.js"

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set")
  console.error("Please set MONGODB_URI before running the seed script")
  process.exit(1)
}

// Sample data
const sampleCallers = [
  {
    username: "rahul_sharma",
    name: "Rahul Sharma",
    email: "rahul@vedavi.com",
    phone: "+91 98765 43210",
    password: "password123",
    role: "caller",
    status: "active",
  },
  {
    username: "priya_patel",
    name: "Priya Patel",
    email: "priya@vedavi.com",
    phone: "+91 98765 43211",
    password: "password123",
    role: "caller",
    status: "active",
  },
  {
    username: "amit_singh",
    name: "Amit Singh",
    email: "amit@vedavi.com",
    phone: "+91 98765 43212",
    password: "password123",
    role: "caller",
    status: "active",
  },
  {
    username: "admin",
    name: "Admin User",
    email: "admin@gmail.com",
    phone: "+91 98765 43213",
    password: "admin123",
    role: "admin",
    status: "active",
  },
]

const sampleBrokers = [
  {
    name: "Vikram Properties",
    email: "vikram@vikramprops.com",
    phone: "+91 98765 11111",
    company: "Vikram Real Estate Pvt Ltd",
    commissionPercentage: 5,
    status: "active",
    notes: "Top performing broker in Mumbai region",
  },
  {
    name: "Neha Real Estate",
    email: "neha@neharealestate.com",
    phone: "+91 98765 22222",
    company: "Neha Real Estate Solutions",
    commissionPercentage: 4.5,
    status: "active",
    notes: "Specializes in residential properties",
  },
  {
    name: "Arjun Properties",
    email: "arjun@arjunprops.com",
    phone: "+91 98765 33333",
    company: "Arjun Property Consultants",
    commissionPercentage: 5.5,
    status: "active",
    notes: "Commercial property expert",
  },
  {
    name: "Priya Estate Agents",
    email: "priya@priyaestate.com",
    phone: "+91 98765 44444",
    company: "Priya Estate Agents Ltd",
    commissionPercentage: 4,
    status: "inactive",
    notes: "Currently on leave",
  },
  {
    name: "Rajesh Holdings",
    email: "rajesh@rajeshholdings.com",
    phone: "+91 98765 55555",
    company: "Rajesh Holdings & Associates",
    commissionPercentage: 6,
    status: "active",
    notes: "Luxury property specialist",
  },
]

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "crm_database",
    })

    console.log("✅ Connected to MongoDB")

    // Clear existing data
    await Lead.deleteMany({})
    await Caller.deleteMany({})
    await Activity.deleteMany({})
    await CallLog.deleteMany({})
    await Broker.deleteMany({})

    console.log("🗑️  Cleared existing data")

    // Insert brokers
    const brokers = await Broker.insertMany(sampleBrokers)
    console.log(`✅ Created ${brokers.length} brokers`)

    // Insert callers
    const callers = await Caller.insertMany(sampleCallers)
    console.log(`✅ Created ${callers.length} callers`)

    // Insert sample leads
    const sampleLeads = [
      {
        name: "Vikram Malhotra",
        phone: "+91 98112 34567",
        email: "vikram.m@email.com",
        city: "Mumbai",
        value: 15000000,
        source: "website",
        stage: "new",
        priority: "hot",
        status: "active",
        assignedCaller: callers[0]._id,
        assignedCallerName: callers[0].name,
        projectName: "Lodha Park",
        nextFollowUp: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        followUpReason: "Interested in 3BHK",
        notes: "Interested in 3BHK",
      },
      {
        name: "Ananya Reddy",
        phone: "+91 99001 12345",
        email: "ananya.r@email.com",
        city: "Bangalore",
        value: 8500000,
        source: "google_ads",
        stage: "qualified",
        priority: "warm",
        status: "active",
        assignedCaller: callers[1]._id,
        assignedCallerName: callers[1].name,
        projectName: "Prestige Lakeside",
      },
      {
        name: "Rajesh Kumar",
        phone: "+91 98234 56789",
        email: "rajesh.k@email.com",
        city: "Delhi",
        value: 25000000,
        source: "referral",
        stage: "proposal",
        priority: "hot",
        status: "active",
        assignedCaller: callers[0]._id,
        assignedCallerName: callers[0].name,
        projectName: "Palm Jumeirah Villa",
        nextFollowUp: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        followUpReason: "Virtual tour scheduled",
      },
      {
        name: "Meera Iyer",
        phone: "+91 97890 12345",
        email: "meera.i@email.com",
        city: "Chennai",
        value: 5500000,
        source: "social_media",
        stage: "negotiation",
        priority: "hot",
        status: "active",
        assignedCaller: callers[2]._id,
        assignedCallerName: callers[2].name,
        projectName: "DLF Cyber City",
      },
      {
        name: "Arjun Nair",
        phone: "+91 96543 21098",
        email: "arjun.n@email.com",
        city: "Hyderabad",
        value: 12000000,
        source: "walk_in",
        stage: "won",
        priority: "warm",
        status: "active",
        assignedCaller: callers[1]._id,
        assignedCallerName: callers[1].name,
        projectName: "Phoenix Towers",
      },
    ]

    const leads = await Lead.insertMany(sampleLeads)
    console.log(`✅ Created ${leads.length} leads`)

    // Create activities
    const activities = await Activity.insertMany([
      {
        leadId: leads[0]._id,
        type: "created",
        description: "New lead created",
        userName: "System",
      },
      {
        leadId: leads[0]._id,
        type: "assigned",
        description: `Lead assigned to ${callers[0].name}`,
        userId: callers[3]._id,
        userName: callers[3].name,
      },
    ])

    console.log(`✅ Created ${activities.length} activities`)

    console.log("🎉 Database seeded successfully!")
    console.log("\n📝 Login credentials:")
    console.log("Email: admin@gmail.com")
    console.log("Password: admin123")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  }
}

seedDatabase()
