/**
 * Mock Data for Dummy Mode
 * Used when database is not configured or global admin is logged in
 */

export const MOCK_PROJECTS = [
  {
    id: 1,
    uid: "project-1",
    name: "Website Redesign",
    slug: "website-redesign",
    description:
      "Modernizing the corporate website with a focus on UX and performance.",
    status: "active",
    priority: "high",
    budget: 15000,
    startDate: "2024-01-15T00:00:00.000Z",
    deadline: "2024-03-30T00:00:00.000Z",
    clientName: "Acme Corp",
    color: "#6366f1",
    starred: true,
    user: { name: "Global Admin", email: "admin@provision.com" },
    _count: { tasks: 12, milestones: 4, files: 8 },
    members: [
      { user: { name: "John Doe", avatarUrl: null } },
      { user: { name: "Jane Smith", avatarUrl: null } },
    ],
  },
  {
    id: 2,
    uid: "project-2",
    name: "Mobile App Development",
    slug: "mobile-app",
    description:
      "Building a cross-platform mobile application for internal logistics.",
    status: "in-progress",
    priority: "medium",
    budget: 45000,
    startDate: "2024-02-01T00:00:00.000Z",
    deadline: "2024-06-15T00:00:00.000Z",
    clientName: "LogiTech Solutions",
    color: "#ec4899",
    starred: false,
    user: { name: "Global Admin", email: "admin@provision.com" },
    _count: { tasks: 25, milestones: 8, files: 15 },
    members: [{ user: { name: "Bob Wilson", avatarUrl: null } }],
  },
];

export const MOCK_TASKS = [
  {
    id: 1,
    uid: "task-1",
    title: "Design System Implementation",
    description: "Create a consistent set of components for the web app.",
    status: "in-progress",
    priority: "high",
    estimateHours: 40,
    loggedHours: 15,
    dueDate: "2024-02-28T00:00:00.000Z",
    projectId: 1,
    project: { name: "Website Redesign", uid: "project-1" },
    assignee: { name: "John Doe", avatarUrl: null },
  },
  {
    id: 2,
    uid: "task-2",
    title: "API Authentication Layer",
    description: "Implement JWT-based auth for the mobile backend.",
    status: "todo",
    priority: "high",
    estimateHours: 24,
    loggedHours: 0,
    dueDate: "2024-03-15T00:00:00.000Z",
    projectId: 2,
    project: { name: "Mobile App Development", uid: "project-2" },
    assignee: { name: "Jane Smith", avatarUrl: null },
  },
];

export const MOCK_ACTIVITIES = [
  {
    id: 1,
    type: "task_completed",
    content: "completed the task 'Landing Page Design'",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    user: { name: "John Doe", avatarUrl: null },
  },
  {
    id: 2,
    type: "comment_added",
    content: "commented on 'Mobile App Development': 'Looks great!'",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    user: { name: "Jane Smith", avatarUrl: null },
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "Project Milestone Reached",
    message: "The Website Redesign project has reached its first milestone.",
    type: "success",
    read: false,
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_USERS = [
  {
    uid: "admin-global",
    name: "Global Admin",
    email: "admin@provision.com",
    role: "Administrator",
    avatarUrl: null,
  },
  {
    uid: "user-1",
    name: "John Doe",
    email: "john@example.com",
    role: "Project Manager",
    avatarUrl: null,
  },
];
