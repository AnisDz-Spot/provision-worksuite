import PROJECTS from "@/data/projects.json";
import TASKS from "@/data/tasks.json";
import USERS from "@/data/users.json";
import { addChatMessage } from "./utils"; // Verify path later

// This utility populates localStorage with rich dummy data
// so that the "Mock Mode" experience isn't empty.

export function seedLocalData() {
  if (typeof window === "undefined") return;

  // 1. Projects
  if (!localStorage.getItem("pv:projects")) {
    localStorage.setItem("pv:projects", JSON.stringify(PROJECTS));
  }

  // 2. Tasks
  if (!localStorage.getItem("pv:tasks")) {
    localStorage.setItem("pv:tasks", JSON.stringify(TASKS));
  }

  // 3. Users
  // The original USERS json has "id" or "uid". We need to normalize to User structure for AuthContext
  if (!localStorage.getItem("pv:users")) {
    const formattedUsers = USERS.map((u: any) => ({
      id: u.uid || u.id,
      name: u.name,
      email: u.email,
      role: u.role || "Member",
      password: "password", // Dummy password
      isAdmin: u.role === "Administrator" || u.role === "Project Manager",
    }));

    // Ensure Demo Admin exists
    const adminExists = formattedUsers.some(
      (u) => u.email === "anis@provision.com"
    );
    if (!adminExists) {
      formattedUsers.push({
        id: "demo-admin",
        name: "Demo Admin",
        email: "anis@provision.com",
        role: "Administrator",
        password: "password123578951",
        isAdmin: true,
      });
    }

    localStorage.setItem("pv:users", JSON.stringify(formattedUsers));
  }

  // 4. Chat Messages
  if (!localStorage.getItem("pv:chatMessages")) {
    seedChatData();
  }
}

function seedChatData() {
  // Generate some fake conversations for the Demo Admin
  const currentUser = "Demo Admin";
  const teammates = ["Alice", "Bob", "Carol", "David"];

  const messages = [
    {
      from: "Alice",
      to: currentUser,
      text: "Hey, did you see the new project specs?",
      offset: 1000 * 60 * 60 * 24 * 2, // 2 days ago
    },
    {
      from: currentUser,
      to: "Alice",
      text: "Yes, looks good! I'll review the budget tomorrow.",
      offset: 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 5,
    },
    {
      from: "Bob",
      to: currentUser,
      text: "Can we reschedule our 1:1?",
      offset: 1000 * 60 * 60 * 4, // 4 hours ago
    },
    {
      from: currentUser,
      to: "Bob",
      text: "Sure, how is 2pm?",
      offset: 1000 * 60 * 60 * 3,
    },
    {
      from: "Carol",
      to: currentUser,
      text: "Deployment is ready for staging.",
      offset: 1000 * 60 * 30, // 30 mins ago
    },
  ];

  const chatMessages: any[] = [];

  messages.forEach((msg) => {
    chatMessages.push({
      id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      fromUser: msg.from, // Matches ChatMessage type
      toUser: msg.to,
      message: msg.text,
      timestamp: Date.now() - msg.offset,
      read: msg.from === currentUser, // Mark sent messages as read (obviously), received as unread for effect
    });
  });

  localStorage.setItem("pv:chatMessages", JSON.stringify(chatMessages));
}
