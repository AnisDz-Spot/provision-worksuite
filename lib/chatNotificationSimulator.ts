// Dummy mode chat notification simulator
// Simulates random incoming chat messages to test notification UI and sound

import { playMessageTone } from "./notificationSound";

export type ChatNotification = {
  id: string;
  from: string;
  message: string;
  timestamp: string;
  avatar?: string;
};

const SAMPLE_MESSAGES = [
  {
    from: "Alice Johnson",
    message: "Hey, can you review the latest designs?",
  },
  {
    from: "Bob Smith",
    message: "Meeting in 10 minutes!",
  },
  {
    from: "Carol Davis",
    message: "I've pushed the latest changes to the repo.",
  },
  {
    from: "David Lee",
    message: "Great work on the dashboard!",
  },
  {
    from: "Eve Wilson",
    message: "Can we schedule a call for tomorrow?",
  },
  {
    from: "Frank Miller",
    message: "The deployment was successful ✅",
  },
];

let simulationInterval: NodeJS.Timeout | null = null;

export function startChatNotificationSimulation(
  onNewMessage: (notification: ChatNotification) => void,
  intervalMs: number = 45000 // Default: every 45 seconds
) {
  if (simulationInterval) {
    stopChatNotificationSimulation();
  }

  simulationInterval = setInterval(() => {
    const randomMessage =
      SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];

    const notification: ChatNotification = {
      id: `chat_${Date.now()}_${Math.random()}`,
      from: randomMessage.from,
      message: randomMessage.message,
      timestamp: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(randomMessage.from)}`,
    };

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
