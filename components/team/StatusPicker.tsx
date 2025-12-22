import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface StatusPickerProps {
  currentStatus?: string;
  currentEmoji?: string;
  onSave: (emoji: string, message: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const PREDEFINED_STATUSES = [
  { emoji: "🌴", message: "On vacation" },
  { emoji: "🤒", message: "Out sick" },
  { emoji: "🏠", message: "Working from home" },
  { emoji: "🎯", message: "Focusing" },
  { emoji: "🚀", message: "In a meeting" },
  { emoji: "💬", message: "Available to chat" },
  { emoji: "☕", message: "On a break" },
  { emoji: "🎉", message: "Celebrating" },
];

const COMMON_EMOJIS = [
  "😀",
  "😊",
  "😎",
  "🤔",
  "😴",
  "🔥",
  "⚡",
  "✨",
  "🎯",
  "🚀",
  "💡",
  "📚",
  "🎨",
  "🎵",
  "🏆",
  "💪",
];

export function StatusPicker({
  currentStatus = "",
  currentEmoji = "",
  onSave,
  onClear,
  onClose,
}: StatusPickerProps) {
  const [customMode, setCustomMode] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji || "💬");
  const [customMessage, setCustomMessage] = useState(currentStatus || "");

  const handlePredefinedClick = (emoji: string, message: string) => {
    onSave(emoji, message);
    onClose();
  };

  const handleCustomSave = () => {
    if (customMessage.trim()) {
      onSave(selectedEmoji, customMessage.trim());
      onClose();
    }
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Set your status</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!customMode ? (
          <>
            <div className="space-y-2 mb-4">
              {PREDEFINED_STATUSES.map((status) => (
                <button
                  key={status.message}
                  onClick={() =>
                    handlePredefinedClick(status.emoji, status.message)
                  }
                  className="w-full p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left flex items-center gap-3"
                >
                  <span className="text-2xl">{status.emoji}</span>
                  <span className="text-sm font-medium">{status.message}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setCustomMode(true)}
                variant="outline"
                className="flex-1"
              >
                Custom Status
              </Button>
              {(currentStatus || currentEmoji) && (
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="flex-1"
                >
                  Clear Status
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                Choose an emoji
              </label>
              <div className="grid grid-cols-8 gap-2 mb-4">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`p-2 text-2xl rounded-lg border transition-colors ${
                      selectedEmoji === emoji
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <label className="text-sm font-medium mb-2 block">
                Status message
              </label>
              <Input
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="What's your status?"
                maxLength={50}
                className="mb-2"
              />
              <p className="text-xs text-muted-foreground">
                {customMessage.length}/50 characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setCustomMode(false)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCustomSave}
                disabled={!customMessage.trim()}
                className="flex-1"
              >
                Save Status
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
