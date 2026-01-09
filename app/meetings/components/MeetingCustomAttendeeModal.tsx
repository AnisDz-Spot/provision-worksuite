import * as React from "react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UserPlus, Mail, User } from "lucide-react";

interface MeetingCustomAttendeeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (attendee: string) => void;
}

export function MeetingCustomAttendeeModal({
  isOpen,
  onOpenChange,
  onAdd,
}: MeetingCustomAttendeeModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleAdd = () => {
    if (name.trim() && email.trim()) {
      // Format: "Name <email@example.com>"
      onAdd(`${name.trim()} <${email.trim()}>`);
      setName("");
      setEmail("");
      onOpenChange(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange} size="md">
      <div className="p-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Add Custom Attendee</h2>
            <p className="text-sm text-muted-foreground">
              Invite external participants to this meeting
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Full Name
            </label>
            <Input
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email Address
            </label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!name.trim() || !email.trim() || !email.includes("@")}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Add Participant
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
