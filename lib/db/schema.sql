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
