"use client";

import React, { RefObject } from "react";
import { Paperclip, X, File, Smile } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (val: string) => void;
  handleSendMessage: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachments: any[];
  removeAttachment: (id: string) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (val: boolean) => void;
  handleEmojiSelect: (emoji: string) => void;
  formatFileSize: (bytes: number) => string;
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  fileInputRef,
  handleFileSelect,
  attachments,
  removeAttachment,
  showEmojiPicker,
  setShowEmojiPicker,
  handleEmojiSelect,
  formatFileSize,
}: ChatInputProps) {
  return (
    <>
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-accent/20">
          <div className="flex gap-2 flex-wrap">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 bg-card border border-border rounded-lg p-2 pr-1"
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <File className="w-8 h-8 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeAttachment(file.id)}
                  className="p-1 hover:bg-accent rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="relative flex-1">
            <Input
              id="chat-message-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMessage()
              }
              placeholder="Type a message..."
              className="flex-1 h-12"
            />
            {showEmojiPicker && (
              <div className="absolute bottom-[calc(100%+12px)] right-0 p-3 bg-card border border-border rounded-lg shadow-lg grid grid-cols-8 gap-2 w-max max-w-[calc(100vw-2rem)] md:max-w-xs z-50">
                {[
                  "😊",
                  "😂",
                  "❤️",
                  "👍",
                  "👎",
                  "🎉",
                  "🔥",
                  "✅",
                  "❌",
                  "💯",
                  "🤔",
                  "😍",
                  "✨",
                  "🙌",
                  "🚀",
                  "💡",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-xl hover:bg-accent p-1 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="shrink-0"
          >
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() && attachments.length === 0}
          >
            Send
          </Button>
        </div>
      </div>
    </>
  );
}
