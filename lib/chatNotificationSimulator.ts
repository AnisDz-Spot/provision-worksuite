// Dummy mode chat notification simulator
// Simulates random incoming chat messages to test notification UI and sound

import { playMessageTone } from "./notificationSound";

export type ChatNotification = {
  id: string;
  from: string;
  message: string;
  timestamp: string;
  avatar?: string;
  role?: "admin" | "project_manager" | "member"; // Role of the sender
};

const SAMPLE_MESSAGES = [
  {
    from: "Alice Johnson",
    message: "Hey, can you review the latest designs?",
    role: "project_manager" as const,
  },
  {
    from: "Bob Smith",
    message: "Meeting in 10 minutes!",
    role: "member" as const,
  },
  {
    from: "Carol Davis",
    message: "I've pushed the latest changes to the repo.",
    role: "member" as const,
  },
  {
    from: "David Lee",
    message: "Great work on the dashboard!",
    role: "admin" as const,
  },
  {
    from: "Eve Wilson",
    message: "Can we schedule a call for tomorrow?",
    role: "project_manager" as const,
  },
  {
    from: "Frank Miller",
    message: "The deployment was successful ✅",
    role: "admin" as const,
  },
];

let simulationInterval: NodeJS.Timeout | null = null;
let notificationCount = 0;
const MAX_DUMMY_NOTIFICATIONS = 5;

export function startChatNotificationSimulation(
  onNewMessage: (notification: ChatNotification) => void,
  intervalMs: number = 45000 // Default: every 45 seconds
) {
  if (simulationInterval) {
    stopChatNotificationSimulation();
  }

  // Reset counter when starting new simulation
  notificationCount = 0;

  simulationInterval = setInterval(() => {
    // In dummy mode, limit to max 5 notifications
    if (notificationCount >= MAX_DUMMY_NOTIFICATIONS) {
      stopChatNotificationSimulation();
      return;
    }

    const randomMessage =
      SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];

    const notification: ChatNotification = {
      id: `chat_${Date.now()}_${Math.random()}`,
      from: randomMessage.from,
      message: randomMessage.message,
      timestamp: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(randomMessage.from)}`,
      role: randomMessage.role,
    };

    // Increment counter
    notificationCount++;

    // Play notification sound
    playMessageTone();

    // Call the callback
    onNewMessage(notification);
  }, intervalMs);

  return () => stopChatNotificationSimulation();
}

export function stopChatNotificationSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}
