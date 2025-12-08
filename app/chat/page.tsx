"use client";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <section className="p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          <MessageCircle className="w-6 h-6" /> 
        </div>
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Team communication coming soon
          </p>
        </div>
      </div>
      <div className="text-center py-12 text-muted-foreground">
        <p>This feature is currently under development.</p>
        <p className="text-sm mt-2">Full chat functionality with file sharing will be available soon.</p>
      </div>
    </section>
  );
}
