-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  project_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  vendor VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  project_id VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
-- Users table

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  system_role VARCHAR(50) NOT NULL,
  job_title VARCHAR(100),
  department VARCHAR(100),
  timezone VARCHAR(50) NOT NULL,
  theme_preference VARCHAR(20) DEFAULT 'light',
  phone_number VARCHAR(20),
  slack_handle VARCHAR(50),
  hourly_cost_rate NUMERIC(10, 2) DEFAULT 0.00,
  hourly_billable_rate NUMERIC(10, 2) DEFAULT 0.00,
  is_billable BOOLEAN DEFAULT TRUE,
  employment_type VARCHAR(50) NOT NULL,
  default_working_hours_per_day NUMERIC(4, 2) DEFAULT 8.00,
  hire_date DATE,
  termination_date DATE,
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

-- Messages table (for chat/conversations)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  from_user VARCHAR(255) NOT NULL,
  to_user VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user);

-- Presence table (tracks user online status and last seen)
CREATE TABLE IF NOT EXISTS presence (
  uid VARCHAR(255) PRIMARY KEY,
  status VARCHAR(50) NOT NULL,
  last_seen TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_status ON presence(status);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- System Settings (for multi-hosting config)
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
