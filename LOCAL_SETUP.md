# Local Development Setup Guide

## Prerequisites
- Node.js installed (v16 or higher)
- npm or yarn package manager
- MongoDB Atlas account (already configured)

## Quick Start (5 minutes)

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Environment Variables
The `.env` file is already configured with your MongoDB connection string. No additional setup needed!

### 3. Start the Application
\`\`\`bash
npm run dev
\`\`\`

This command will start both the backend server and frontend in parallel:
- **Backend Server**: http://localhost:5000
- **Frontend App**: http://localhost:5173

### 4. Login
Once the app loads, use these credentials:
- **Email**: admin@gmail.com
- **Password**: admin123

## Available Scripts

\`\`\`bash
# Run both frontend and backend together
npm run dev

# Run only the backend server
npm run server

# Run only the frontend (Vite)
npm run client

# Seed the database with sample data
npm run seed

# Build for production
npm build

# Lint code
npm run lint

# Preview production build
npm run preview
\`\`\`

## Folder Structure

\`\`\`
├── server/
│   ├── index.js              # Main Express server
│   ├── routes/               # API routes
│   ├── models/               # MongoDB models
│   └── ...
├── src/
│   ├── pages/                # React pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   └── ...
├── .env                      # Local environment variables
└── package.json
\`\`\`

## MongoDB Connection Details

Your app is connected to MongoDB Atlas at:
- **Cluster**: Cluster0
- **Database**: test
- **Collections**: leads, callers, activities, call-logs, settings

## Troubleshooting

### "Cannot find module" errors
\`\`\`bash
rm -rf node_modules
npm install
\`\`\`

### Port 5000 already in use
Edit `.env` and change PORT to another number (e.g., 5001):
\`\`\`
PORT=5001
\`\`\`

### MongoDB connection errors
- Check that your MongoDB Atlas network access allows your IP
- Verify the connection string in `.env` is correct
- Make sure MongoDB Atlas cluster is running

### Frontend not connecting to backend
- Ensure backend is running on the correct port (default 5000)
- Check that API calls use the correct endpoint: `http://localhost:5000/api/*`

## Next Steps

1. Customize the admin user in `/server/models/Caller.js`
2. Add your sales leads and start tracking
3. Configure email notifications in `/server/routes/activities.js`
4. Deploy to Vercel when ready (see DEPLOYMENT.md)
