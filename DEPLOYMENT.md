# Deployment Instructions for Vercel

## Prerequisites
- A Vercel account (sign up at vercel.com)
- MongoDB Atlas account (or any MongoDB database)

## Steps to Deploy

### 1. Push to GitHub
First, push your code to a GitHub repository.

### 2. Import to Vercel
1. Go to vercel.com and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect the framework settings

### 3. Configure Environment Variables
In the Vercel project settings, add the following environment variable:

**MONGODB_URI**: Your MongoDB connection string
- Example: `mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0`

### 4. Deploy
Click "Deploy" and Vercel will build and deploy your application.

## Default Login Credentials

Once deployed, you can log in with:
- **Email**: admin@gmail.com
- **Password**: admin123

The admin user is automatically created on the first login attempt if it doesn't exist in the database.

## Post-Deployment

### Seed Database (Optional)
If you want to add sample data, you can run the seed script locally:
\`\`\`bash
npm run seed
\`\`\`

Note: Make sure your MONGODB_URI environment variable points to your production database.

## Architecture

- **Frontend**: Vite + React + TypeScript
- **Backend**: Express.js API (runs as Vercel serverless functions)
- **Database**: MongoDB (via MongoDB Atlas or your preferred MongoDB provider)

## API Routes

All API routes are available at `/api/*`:
- `/api/auth` - Authentication
- `/api/leads` - Lead management
- `/api/callers` - Caller management
- `/api/activities` - Activity tracking
- `/api/call-logs` - Call logging
- `/api/dashboard` - Dashboard data
- `/api/reports` - Reports
- `/api/settings` - Settings

## Troubleshooting

### Database Connection Issues
- Verify your MONGODB_URI is correctly set in Vercel environment variables
- Ensure your MongoDB Atlas IP whitelist includes Vercel's IP addresses (or use 0.0.0.0/0 for all IPs)

### Build Failures
- Check Vercel build logs for specific errors
- Ensure all dependencies are listed in package.json

### API Routes Not Working
- Verify the vercel.json configuration is correct
- Check that API calls from frontend use relative paths (e.g., `/api/auth/login`)
\`\`\`

\`\`\`typescript file="" isHidden
