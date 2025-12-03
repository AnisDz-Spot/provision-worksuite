# 🚀 Vercel Database & Storage Setup

Complete guide to use Vercel Postgres and Vercel Blob instead of Firebase.

---

## Why Vercel Postgres + Blob?

✅ **Native Vercel Integration** - Zero configuration, works instantly  
✅ **Free Tier** - 60 hours compute time, 256 MB storage  
✅ **Fast** - Deployed at the edge, minimal latency  
✅ **Simple** - SQL queries, no complex setup  
✅ **Testing Ready** - Perfect for demos and client testing  

---

## 🎯 Quick Setup (5 minutes)

### Step 1: Enable Vercel Postgres

1. Go to your Vercel project dashboard
2. Click **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose region closest to you
6. Click **Create**

Vercel automatically adds these environment variables:
```bash
POSTGRES_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

### Step 2: Enable Vercel Blob Storage

1. In Vercel dashboard → **Storage** tab
2. Click **Create Database**
3. Select **Blob**
4. Click **Create**

Vercel automatically adds:
```bash
BLOB_READ_WRITE_TOKEN
```

---

## 📦 Install Dependencies

```bash
npm install @vercel/postgres @vercel/blob
```

---

## 🗄️ Database Schema

Create the database tables:

### Option A: Via Vercel Dashboard

1. Go to Storage → Your Postgres database → **Query** tab
2. Paste and run this SQL:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  owner TEXT NOT NULL,
  user_id TEXT NOT NULL,
  start_date DATE,
  deadline DATE,
  budget DECIMAL(10, 2),
  progress INTEGER DEFAULT 0,
  starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assignee TEXT,
  due DATE,
  estimate_hours DECIMAL(5, 2),
  logged_hours DECIMAL(5, 2) DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time logs table
CREATE TABLE IF NOT EXISTS time_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  hours DECIMAL(5, 2) NOT NULL,
  note TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  target_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_project_id ON time_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
```

### Option B: Via Migration Script

Create `scripts/migrate.ts`:

```typescript
import { sql } from '@vercel/postgres';

async function migrate() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // ... rest of tables
    
    console.log('✅ Database migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrate();
```

Run: `npx tsx scripts/migrate.ts`

---

## 📝 Implementation Files

I'll create these files for you:

1. **`lib/vercel-db.ts`** - Database operations (CRUD)
2. **`lib/vercel-storage.ts`** - File upload/download
3. **`lib/hooks/useVercelData.ts`** - React hooks for data fetching
4. **`components/vercel/MigrationTool.tsx`** - Migrate from localStorage

---

## 🔄 Migration from localStorage

Run the migration tool once to transfer existing data:

```tsx
import { VercelMigrationTool } from '@/components/vercel/MigrationTool';

// Add temporarily to any page
<VercelMigrationTool />
```

---

## 📊 Usage Examples

### Create a Project

```typescript
import { createProject } from '@/lib/vercel-db';

const project = await createProject({
  name: 'New Website',
  description: 'Build a modern site',
  status: 'active',
  owner: 'John Doe',
  userId: 'user123',
  startDate: '2025-01-01',
  budget: 50000,
  progress: 0,
});
```

### Get Projects with React Hook

```typescript
import { useProjects } from '@/lib/hooks/useVercelData';

function ProjectsList() {
  const { projects, loading, error } = useProjects('user123');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
}
```

### Upload File to Blob Storage

```typescript
import { uploadFile } from '@/lib/vercel-storage';

const url = await uploadFile(file, 'projects/doc.pdf');
console.log('File uploaded:', url);
```

---

## 💰 Pricing (as of 2025)

### Vercel Postgres
- **Hobby (Free)**: 60 hours compute, 256 MB storage
- **Pro ($20/mo)**: 100 hours compute, 512 MB storage
- **Enterprise**: Custom

### Vercel Blob
- **Hobby (Free)**: 1 GB storage, 100 GB bandwidth/month
- **Pro ($20/mo)**: Included in Pro plan
- **Enterprise**: Custom

### Comparison with Firebase
| Feature | Vercel | Firebase Free |
|---------|--------|---------------|
| Database | 256 MB | 1 GB |
| Storage | 1 GB | 5 GB |
| Setup | Instant | 10-15 min |
| Integration | Native | SDK required |

---

## 🔒 Security

Vercel automatically secures your database:
- Environment variables are encrypted
- Database is not publicly accessible
- Only your Vercel functions can access it
- SSL/TLS encryption enabled

**Important:** Never expose `POSTGRES_URL` or `BLOB_READ_WRITE_TOKEN` in client-side code!

---

## 🚦 Ready to Deploy?

1. ✅ Enable Vercel Postgres
2. ✅ Enable Vercel Blob
3. ✅ Run database migration
4. ✅ Install dependencies: `npm install @vercel/postgres @vercel/blob`
5. ✅ Replace Firebase imports with Vercel imports
6. ✅ Test locally with Vercel CLI: `vercel dev`
7. ✅ Deploy: `git push` (automatic)

---

## 🎯 Next Steps

Would you like me to:

1. **Create the implementation files** (`lib/vercel-db.ts`, `lib/vercel-storage.ts`, hooks, etc.)?
2. **Generate the migration script** to move data from localStorage to Vercel Postgres?
3. **Update existing components** to use Vercel DB instead of localStorage?

Just let me know and I'll implement it! 🚀

---

## 📚 Resources

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [SQL Cheat Sheet](https://www.postgresql.org/docs/current/sql.html)
