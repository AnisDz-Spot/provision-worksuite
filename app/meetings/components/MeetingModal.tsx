import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AttendeeSelector } from "@/components/workflow/AttendeeSelector";
import { Meeting } from "@/app/meetings/types/meeting"; // Import Meeting from shared types
import dynamic from "next/dynamic";
import { useState } from "react";
import { MeetingCustomAttendeeModal } from "./MeetingCustomAttendeeModal";

// Dynamically import RichTextEditor to avoid SSR issues if it uses browser-only APIs
// Dynamically import RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(
  () =>
    import("@/components/ui/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
  }
);

interface User {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface MeetingFormData {
  title: string;
  date: string;
  projectId: string | null;
  content: string;
  attendees: string[];
}

interface MeetingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  formData: Partial<Meeting>;
  setFormData: (data: any) => void;
  teamMembers: User[];
  projects: Project[];
  onSave: () => void;
}

export function MeetingModal({
  isOpen,
  onOpenChange,
  isEditing,
  formData,
  setFormData,
  teamMembers,
  projects,
  onSave,
}: MeetingModalProps) {
  const [customOpen, setCustomOpen] = useState(false);
  return (
    <Modal open={isOpen} onOpenChange={onOpenChange} size="lg">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? "Edit Meeting" : "New Meeting"}
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Meeting Title
          </label>
          <Input
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Sprint Planning - Week 48"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date & Time</label>
          <Input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <RichTextEditor
            value={formData.content || ""}
            onChange={(html) => setFormData({ ...formData, content: html })}
            placeholder="Write meeting notes..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Attendees</label>
          <AttendeeSelector
            selectedAttendees={formData.attendees || []}
            onChange={(attendees) => setFormData({ ...formData, attendees })}
            teamMembers={teamMembers}
            onAddCustom={() => setCustomOpen(true)}
            id="new-attendee-search"
            name="new-attendee-search"
          />
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            {isEditing ? "Save Changes" : "Create Meeting"}
          </Button>
        </div>
      </div>
      <MeetingCustomAttendeeModal
        isOpen={customOpen}
        onOpenChange={setCustomOpen}
        onAdd={(attendee) => {
          const current = formData.attendees || [];
          if (!current.includes(attendee)) {
            setFormData({ ...formData, attendees: [...current, attendee] });
          }
        }}
      />
    </Modal>
  );
}
