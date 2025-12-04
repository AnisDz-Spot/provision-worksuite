-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'member',
  password_hash VARCHAR(255),
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

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color_hex VARCHAR(7),
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Migration content: add password_hash column safely if not present
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Blocker categories table (for configurable categories with emoji icons)
CREATE TABLE IF NOT EXISTS blocker_categories (
  id VARCHAR(255) PRIMARY KEY, -- kebab-case id
  label VARCHAR(255) NOT NULL,
  default_owner_group VARCHAR(255) NOT NULL,
  sla_days INTEGER NOT NULL DEFAULT 7,
  icon_emoji VARCHAR(16) NOT NULL
);

-- Blockers table (reports tracked per project)
CREATE TABLE IF NOT EXISTS blockers (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  level VARCHAR(50) NOT NULL, -- e.g., low/medium/high/critical
  status VARCHAR(50) NOT NULL, -- e.g., open/resolved
  impacted_tasks TEXT, -- JSON array of task ids
  assigned_to VARCHAR(255),
  reported_by VARCHAR(255) NOT NULL,
  reported_date DATE NOT NULL,
  resolved_date DATE,
  resolution TEXT,
  category VARCHAR(255) NOT NULL REFERENCES blocker_categories(id),
  project_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blockers_project_id ON blockers(project_id);
CREATE INDEX IF NOT EXISTS idx_blockers_status ON blockers(status);
