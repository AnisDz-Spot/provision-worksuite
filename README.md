# ProVision WorkSuite

A modern, production-ready project management platform built with Next.js 16, React 19, TypeScript 5, and TailwindCSS 4. Features a complete project tracking system with tasks, team management, analytics, and real-time collaboration.

## Features

- **Dashboard**: Analytics widgets, project stats, recent activity, and performance metrics
- **Project Management**: Create, track, and manage projects with milestones and budgets
- **Task Management**: Kanban board with drag-and-drop, task assignments, and time tracking
- **Team Collaboration**: User management, role-based access, and activity feeds
- **Calendar**: Event scheduling and deadline tracking
- **Dark/Light Theme**: Automatic theme detection with manual override
- **Responsive Design**: Mobile-first, works seamlessly on all devices
- **Database Storage**: PostgreSQL (Neon) for data, Vercel Blob for file uploads

## Tech Stack

- **Next.js 16** (App Router with Turbopack)
- **React 19** & **TypeScript 5**
- **TailwindCSS 4** (native CSS support)
- **Vercel Postgres** (Neon) - Database
- **Vercel Blob** - File storage
- **Shadcn/ui**, **Radix UI**, **Heroicons**
- **Framer Motion** - Animations
- **Recharts** - Analytics charts
- **@tanstack/react-table** - Data tables

## For Developers

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database Setup

The app uses Vercel Postgres (Neon) and Vercel Blob storage. Database schema is in `lib/db/schema.sql`.

**Environment Variables** (automatically set by Vercel):

- `POSTGRES_URL` - Database connection string
- `POSTGRES_PRISMA_URL` - Prisma connection
- `POSTGRES_URL_NON_POOLING` - Direct connection
- `BLOB_READ_WRITE_TOKEN` - File storage token

### Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── auth/              # Login, register, forgot password
│   ├── dashboard/         # Main dashboard (/)
│   ├── projects/          # Project management
│   ├── tasks/             # Kanban task board
│   ├── team/              # Team members
│   ├── calendar/          # Calendar view
│   ├── settings/          # User settings
│   └── test-database/     # Database testing page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard widgets
│   ├── layout/           # Navbar, sidebar
│   ├── tasks/            # Kanban board
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities and database
│   ├── db/               # Database functions & schema
│   ├── storage/          # File upload utilities
│   ├── firebase.ts       # Auth configuration
│   └── utils.ts          # Helper functions
└── data/                  # Demo data (JSON)
```

### Database Functions

Import and use database utilities:

```typescript
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/db/postgres";

// Get all projects
const projects = await getAllProjects();

// Create new project
const newProject = await createProject({
  name: "Website Redesign",
  description: "Modernize company website",
  status: "active",
  owner: "John Doe",
  progress: 0,
  userId: "user-123",
});
```

### File Upload

```typescript
import { uploadAvatar, uploadProjectDocument } from "@/lib/storage/vercel-blob";

// Upload user avatar (max 5MB)
const avatarUrl = await uploadAvatar(file, "user-123");

// Upload project document (max 10MB)
const docUrl = await uploadProjectDocument(file, "proj_abc123", (progress) => {
  console.log(`Upload: ${progress.progress}%`);
});
```

### Deployment

**Vercel** (Recommended):

1. Connect your GitHub repository
2. Vercel auto-detects Next.js and configures build
3. Add Postgres database in Vercel Storage
4. Add Blob storage in Vercel Storage
5. Environment variables are automatically configured
6. Deploy!

**Manual Deployment**:

```bash
npm run build
npm start
```

## For End Users

### Accessing the App

Visit the deployed URL provided by your administrator. No installation required - ProVision WorkSuite is a web application that runs in your browser.

### First Time Setup

1. **Register**: Click "Register" and create your account with email and password
2. **Login**: Use your credentials to access the dashboard
3. **Complete Profile**: Add your name and avatar in Settings

### Using the Platform

**Projects**:

- Click "New Project" to create a project
- Set deadlines, budgets, and assign team members
- Track progress with visual indicators

**Tasks**:

- Use the Kanban board to manage tasks
- Drag and drop tasks between columns (To Do → In Progress → Done)
- Assign tasks to team members
- Log time spent on tasks

**Team**:

- View all team members and their activity
- See who's working on what
- Track task completion rates

**Calendar**:

- View all project deadlines and events
- Schedule meetings and milestones
- Get reminders for upcoming dates

**Settings**:

- Update your profile information
- Change password
- Switch between dark and light themes
- Configure notification preferences

### Support

For questions or issues, contact your system administrator.

## License

Proprietary - All rights reserved

---

**ProVision WorkSuite** - Enterprise Project Management Platform

## Buyer Installation (ThemeForest)

This section explains how purchasers can install or host the app.

**Requirements:** Node.js 18+, npm, a Git client, and a Vercel account (free tier works).

### Quick Start (Recommended)

1. **Deploy to Vercel** (one-click hosting):
   - Fork or upload this repository to GitHub
   - Go to [vercel.com/new](https://vercel.com/new) and import your repository
   - Vercel will auto-detect Next.js and deploy

2. **Add Storage** (in Vercel dashboard):
   - Go to **Storage** tab → Create **Postgres** database (Neon)
   - Go to **Storage** tab → Create **Blob** storage
   - Environment variables are automatically configured!

3. **Initialize Database**:
   - In Vercel dashboard → **Storage** → Click your Postgres database
   - Go to **Query** tab
   - Copy entire content from `lib/db/schema.sql` in this repository
   - Paste and click **Run**

4. **First-Time Setup** (One-time only):
   - Visit your deployed URL
   - Login with: `anis@provision.com` / `password123578951`
   - You'll be redirected to **Database Configuration** page
   - Enter your Postgres URL and Blob Token (found in Vercel Storage → .env.local tabs)
   - Click **Test Connection** → Should show green ✅
   - Click **Save & Continue**
   - Complete your **Admin Profile**:
     - Username, full name
     - Your real email address (confirm it)
     - Your secure password (confirm it)
     - Optional: Upload avatar
   - Click **Complete Setup**
   - You'll be logged out automatically

5. **Login with Your New Account**:
   - Login with your newly created email and password
   - The temporary `anis@provision.com` login is now disabled
   - Start using ProVision WorkSuite!

### Database Configuration

When you create Postgres and Blob storage in Vercel, you'll need these values (found in Storage → .env.local):

```env
POSTGRES_URL=postgres://default:xxxxx@xxxx.neon.tech:5432/verceldb
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

Enter these in the **Database Configuration** page during first-time setup. The app stores them securely and connects automatically.

### Alternative Hosting Options

**Self-Host:**

```bash
npm install
npm run build
npm start
```

Set environment variables in `.env.local` (same as above), execute `lib/db/schema.sql`, then visit `http://localhost:3000` for setup.

**Netlify:** Build: `npm run build`, publish: `.next`. Add environment variables, execute schema, complete setup at your URL.

### First-Run Checklist

- Can reach the site URL.
- Database tables exist after running `lib/db/schema.sql`.
- File uploads work (check a test upload).
- Create an account via Register page and login successfully.

### Support for Buyers

If you need help deploying, provide:

- Your hosting platform (Vercel/Netlify/Custom)
- Error messages or logs
- Confirmation that `lib/db/schema.sql` was executed
