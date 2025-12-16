// Notification sound utility
// Play a sound when a new notification arrives

const audio: HTMLAudioElement | null = null;

export function playNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    // Create a simple notification beep using Web Audio API
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = 800; // Frequency in Hertz
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, context.currentTime); // Volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
}

export function playMessageTone() {
  if (typeof window === "undefined") return;

  try {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();

    // Play two tones for a "ding-dong" effect
    const playTone = (frequency: number, startTime: number) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    };

    playTone(600, context.currentTime);
    playTone(800, context.currentTime + 0.15);
  } catch (error) {
    console.error("Error playing message tone:", error);
  }
}
