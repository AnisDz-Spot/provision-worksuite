# 🔷 Vercel Database & Storage Setup Guide

Complete guide to use Vercel Postgres and Vercel Blob instead of Firebase for testing.

---

## 🎯 Why Vercel?

**Advantages:**
- ✅ Built into your hosting platform
- ✅ Zero-config integration with your app
- ✅ Generous free tier (perfect for testing)
- ✅ Automatic connection through environment variables
- ✅ Great developer experience

---

## 📦 Part 1: Vercel Postgres Setup

### Step 1: Create Database in Vercel

1. Go to your project dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **provision-worksuite** project
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name: `provision-worksuite-db`
7. Select region closest to you
8. Click **Create**

### Step 2: Install Vercel Postgres SDK

```bash
npm install @vercel/postgres
```

### Step 3: Create Database Schema

Create `lib/db/schema.sql`:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  owner VARCHAR(255) NOT NULL,
  start_date DATE,
  deadline DATE,
  budget DECIMAL(10, 2),
  progress INTEGER DEFAULT 0,
  priority VARCHAR(20),
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  project_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(20) DEFAULT 'medium',
  assignee VARCHAR(255),
  due DATE,
  estimate_hours DECIMAL(5, 2),
  logged_hours DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Time logs table
CREATE TABLE IF NOT EXISTS time_logs (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255) NOT NULL,
  hours DECIMAL(5, 2) NOT NULL,
  note TEXT,
  logged_by VARCHAR(255) NOT NULL,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_project_id ON time_logs(project_id);
```

### Step 4: Run Schema in Vercel

1. Go to your database in Vercel dashboard
2. Click **Query** tab
3. Paste the SQL schema
4. Click **Execute**

### Step 5: Create Database Utilities

Create `lib/db/postgres.ts`:

```typescript
import { sql } from '@vercel/postgres';

export type Project = {
  id: string;
  uid: string;
  name: string;
  description?: string;
  status: string;
  owner: string;
  startDate?: string;
  deadline?: string;
  budget?: number;
  progress: number;
  priority?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Task = {
  id: string;
  uid: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: string;
  due?: string;
  estimateHours?: number;
  loggedHours?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

// ============================================================================
// PROJECTS
// ============================================================================

export async function createProject(project: Omit<Project, 'id' | 'uid' | 'createdAt' | 'updatedAt'>) {
  const uid = \`proj_\${Date.now()}_\${Math.random().toString(36).slice(2)}\`;
  
  const result = await sql\`
    INSERT INTO projects (uid, name, description, status, owner, start_date, deadline, budget, progress, priority, user_id)
    VALUES (\${uid}, \${project.name}, \${project.description || null}, \${project.status}, \${project.owner}, 
            \${project.startDate || null}, \${project.deadline || null}, \${project.budget || null}, 
            \${project.progress}, \${project.priority || null}, \${project.userId})
    RETURNING *
  \`;
  
  return result.rows[0];
}

export async function getProjectById(uid: string) {
  const result = await sql\`
    SELECT * FROM projects WHERE uid = \${uid}
  \`;
  return result.rows[0];
}

export async function getAllProjects(userId?: string) {
  if (userId) {
    const result = await sql\`
      SELECT * FROM projects WHERE user_id = \${userId} ORDER BY updated_at DESC
    \`;
    return result.rows;
  }
  
  const result = await sql\`
    SELECT * FROM projects ORDER BY updated_at DESC
  \`;
  return result.rows;
}

export async function updateProject(uid: string, updates: Partial<Project>) {
  const result = await sql\`
    UPDATE projects 
    SET 
      name = COALESCE(\${updates.name}, name),
      description = COALESCE(\${updates.description}, description),
      status = COALESCE(\${updates.status}, status),
      progress = COALESCE(\${updates.progress}, progress),
      priority = COALESCE(\${updates.priority}, priority),
      updated_at = NOW()
    WHERE uid = \${uid}
    RETURNING *
  \`;
  return result.rows[0];
}

export async function deleteProject(uid: string) {
  await sql\`DELETE FROM projects WHERE uid = \${uid}\`;
}

// ============================================================================
// TASKS
// ============================================================================

export async function createTask(task: Omit<Task, 'id' | 'uid' | 'createdAt' | 'updatedAt'>) {
  const uid = \`task_\${Date.now()}_\${Math.random().toString(36).slice(2)}\`;
  
  const result = await sql\`
    INSERT INTO tasks (uid, project_id, title, description, status, priority, assignee, due, estimate_hours, logged_hours)
    VALUES (\${uid}, \${task.projectId}, \${task.title}, \${task.description || null}, \${task.status}, 
            \${task.priority}, \${task.assignee || null}, \${task.due || null}, 
            \${task.estimateHours || null}, \${task.loggedHours || 0})
    RETURNING *
  \`;
  
  return result.rows[0];
}

export async function getTasksByProject(projectId: string) {
  const result = await sql\`
    SELECT * FROM tasks WHERE project_id = \${projectId} ORDER BY created_at DESC
  \`;
  return result.rows;
}

export async function getAllTasks() {
  const result = await sql\`
    SELECT * FROM tasks ORDER BY created_at DESC
  \`;
  return result.rows;
}

export async function updateTask(uid: string, updates: Partial<Task>) {
  const result = await sql\`
    UPDATE tasks 
    SET 
      title = COALESCE(\${updates.title}, title),
      description = COALESCE(\${updates.description}, description),
      status = COALESCE(\${updates.status}, status),
      priority = COALESCE(\${updates.priority}, priority),
      assignee = COALESCE(\${updates.assignee}, assignee),
      logged_hours = COALESCE(\${updates.loggedHours}, logged_hours),
      updated_at = NOW()
    WHERE uid = \${uid}
    RETURNING *
  \`;
  return result.rows[0];
}

export async function deleteTask(uid: string) {
  await sql\`DELETE FROM tasks WHERE uid = \${uid}\`;
}

// ============================================================================
// TIME LOGS
// ============================================================================

export async function addTimeLog(timeLog: {
  taskId: string;
  projectId: string;
  hours: number;
  note?: string;
  loggedBy: string;
}) {
  const result = await sql\`
    INSERT INTO time_logs (task_id, project_id, hours, note, logged_by)
    VALUES (\${timeLog.taskId}, \${timeLog.projectId}, \${timeLog.hours}, 
            \${timeLog.note || null}, \${timeLog.loggedBy})
    RETURNING *
  \`;
  return result.rows[0];
}

export async function getTimeLogsByTask(taskId: string) {
  const result = await sql\`
    SELECT * FROM time_logs WHERE task_id = \${taskId} ORDER BY logged_at DESC
  \`;
  return result.rows;
}

export async function getTimeLogsByProject(projectId: string) {
  const result = await sql\`
    SELECT * FROM time_logs WHERE project_id = \${projectId} ORDER BY logged_at DESC
  \`;
  return result.rows;
}
```

---

## 📦 Part 2: Vercel Blob Storage Setup

### Step 1: Create Blob Store

1. In Vercel dashboard → **Storage** tab
2. Click **Create Database**
3. Select **Blob**
4. Name it: `provision-worksuite-files`
5. Click **Create**

### Step 2: Install Vercel Blob SDK

```bash
npm install @vercel/blob
```

### Step 3: Create Storage Utilities

Create `lib/storage/vercel-blob.ts`:

```typescript
import { put, del, list } from '@vercel/blob';

export type UploadProgress = {
  loaded: number;
  total: number;
  progress: number;
};

// ============================================================================
// FILE UPLOADS
// ============================================================================

export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    // Simulate progress if callback provided
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, progress: 0 });
    }

    const blob = await put(\`\${path}/\${file.name}\`, file, {
      access: 'public',
    });

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, progress: 100 });
    }

    return blob.url;
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error('Failed to upload file');
  }
}

export async function uploadAvatar(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be less than 5MB');
  }

  return uploadFile(file, \`avatars/\${userId}\`, onProgress);
}

export async function uploadProjectDocument(
  file: File,
  projectId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  // Validate file size
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File must be less than 10MB');
  }

  return uploadFile(file, \`projects/\${projectId}\`, onProgress);
}

export async function uploadTaskAttachment(
  file: File,
  taskId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File must be less than 10MB');
  }

  return uploadFile(file, \`tasks/\${taskId}\`, onProgress);
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

export async function deleteFile(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error('Delete failed:', error);
    throw new Error('Failed to delete file');
  }
}

export async function listFiles(path: string) {
  try {
    const { blobs } = await list({ prefix: path });
    return blobs;
  } catch (error) {
    console.error('List files failed:', error);
    throw new Error('Failed to list files');
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

export function validateFile(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
}): boolean {
  const { maxSize = 10 * 1024 * 1024, allowedTypes } = options;

  if (file.size > maxSize) {
    throw new Error(\`File size must be less than \${formatFileSize(maxSize)}\`);
  }

  if (allowedTypes && !allowedTypes.some(type => file.type.startsWith(type))) {
    throw new Error(\`File type must be one of: \${allowedTypes.join(', ')}\`);
  }

  return true;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

---

## 🔄 Part 3: Migration from LocalStorage

Create `lib/migrate-to-vercel.ts`:

```typescript
import { createProject, createTask } from './db/postgres';

export async function migrateFromLocalStorage() {
  if (typeof window === 'undefined') return;

  try {
    // Get localStorage data
    const projectsData = localStorage.getItem('pv:projects');
    const tasksData = localStorage.getItem('pv:tasks');

    if (!projectsData && !tasksData) {
      console.log('No data to migrate');
      return { success: false, message: 'No data found' };
    }

    const projects = projectsData ? JSON.parse(projectsData) : [];
    const tasks = tasksData ? JSON.parse(tasksData) : [];

    // Migrate projects
    let migratedProjects = 0;
    for (const project of projects) {
      await createProject({
        name: project.name,
        description: project.description,
        status: project.status || 'active',
        owner: project.owner,
        startDate: project.startDate,
        deadline: project.deadline,
        budget: project.budget,
        progress: project.progress || 0,
        priority: project.priority,
        userId: 'default-user', // Replace with actual user ID
      });
      migratedProjects++;
    }

    // Migrate tasks
    let migratedTasks = 0;
    for (const task of tasks) {
      await createTask({
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignee: task.assignee,
        due: task.due,
        estimateHours: task.estimateHours,
        loggedHours: task.loggedHours || 0,
      });
      migratedTasks++;
    }

    return {
      success: true,
      message: \`Migrated \${migratedProjects} projects and \${migratedTasks} tasks\`,
      migratedProjects,
      migratedTasks,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      message: \`Migration failed: \${error instanceof Error ? error.message : 'Unknown error'}\`,
    };
  }
}
```

---

## 🚀 Part 4: Deployment

### Environment Variables

Vercel automatically adds these when you create the database:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `BLOB_READ_WRITE_TOKEN`

No manual configuration needed! ✅

### Update Your Components

Replace Firebase imports with Vercel:

```typescript
// Before
import { getAllProjects } from '@/lib/firestore';

// After
import { getAllProjects } from '@/lib/db/postgres';

// Usage remains the same!
const projects = await getAllProjects();
```

---

## 💰 Pricing Comparison

### Vercel Free Tier:
- **Postgres**: 256 MB storage, 60 hours compute/month
- **Blob**: 1 GB storage, 100 GB bandwidth
- Perfect for testing and small projects

### Firebase Free Tier:
- **Firestore**: 1 GB storage, 50K reads/day
- **Storage**: 5 GB storage, 1 GB/day downloads
- Better for larger projects with real-time needs

---

## ✅ Testing Checklist

After setup:

- [ ] Database schema executed successfully
- [ ] Can create a project via API
- [ ] Can retrieve projects from database
- [ ] File upload works
- [ ] Can download uploaded files
- [ ] Migration from localStorage works
- [ ] All CRUD operations functional

---

## 🎯 Next Steps

1. **For Testing**: Use Vercel (you're ready!)
2. **For Production**: Consider Firebase for real-time features
3. **Hybrid Approach**: Use both (Vercel for storage, Firebase for real-time)

---

## 📚 Resources

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [Migration Guide](https://vercel.com/guides/migrate-to-vercel-postgres)

Your Vercel database and storage are now ready for testing! 🎉
