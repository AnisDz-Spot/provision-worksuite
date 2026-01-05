import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { AttendeeSelector } from "@/components/workflow/AttendeeSelector";
import { sanitizeHtml } from "@/lib/sanitize";
import { Users, CheckCircle2, Circle, Clock, Pencil, X } from "lucide-react";
import Image from "next/image";

import { Meeting, ActionItem } from "@/app/meetings/types/meeting";

interface User {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
}

interface MeetingDetailViewProps {
  meeting: Meeting;
  teamMembers: User[];
  onUpdate: (meeting: Meeting) => void;
  onRefresh: () => void;
}

export function MeetingDetailView({
  meeting,
  teamMembers,
  onUpdate,
  onRefresh,
}: MeetingDetailViewProps) {
  const [tab, setTab] = useState<"overview" | "notes" | "actions">("overview");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(meeting.content || "");
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaDraft, setMetaDraft] = useState({
    title: meeting.title,
    date: new Date(meeting.date).toISOString().slice(0, 16),
    projectId: meeting.projectId,
    attendees: meeting.attendees,
  });

  const [aiText, setAiText] = useState("");
  const [aiAssignee, setAiAssignee] = useState("");
  const [aiDue, setAiDue] = useState("");

  const handleToggleAction = (actionId: string) => {
    const updated = {
      ...meeting,
      actionItems: meeting.actionItems.map((ai) =>
        ai.id === actionId ? { ...ai, completed: !ai.completed } : ai
      ),
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
  };

  const handleAddAction = () => {
    if (!aiText.trim()) return;
    const newItem: ActionItem = {
      id: `ai-${Date.now()}`,
      text: aiText.trim(),
      assignedTo: aiAssignee || "",
      dueDate: aiDue || new Date().toISOString(),
      completed: false,
    };
    const updated = {
      ...meeting,
      actionItems: [newItem, ...meeting.actionItems],
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    setAiText("");
    setAiAssignee("");
    setAiDue("");
  };

  const handleSaveNotes = () => {
    onUpdate({
      ...meeting,
      content: notesDraft,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingNotes(false);
  };

  const handleSaveMeta = () => {
    onUpdate({
      ...meeting,
      ...metaDraft,
      date: new Date(metaDraft.date).toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsEditingMeta(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Date */}
      <div className="flex justify-between items-start">
        {!isEditingMeta ? (
          <div>
            <h2 className="text-2xl font-bold">{meeting.title}</h2>
            <p className="text-muted-foreground">
              {new Date(meeting.date).toLocaleString([], {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <div className="space-y-4 flex-1 mr-4">
            <Input
              value={metaDraft.title}
              onChange={(e) =>
                setMetaDraft({ ...metaDraft, title: e.target.value })
              }
              className="text-xl font-bold"
            />
            <Input
              type="datetime-local"
              value={metaDraft.date}
              onChange={(e) =>
                setMetaDraft({ ...metaDraft, date: e.target.value })
              }
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            isEditingMeta ? handleSaveMeta() : setIsEditingMeta(true)
          }
        >
          {isEditingMeta ? (
            "Save Changes"
          ) : (
            <>
              <Pencil className="w-4 h-4 mr-2" /> Edit Meta
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: "overview", label: "Overview" },
          { key: "notes", label: "Notes" },
          { key: "actions", label: "Action Items" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {tab === "overview" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Attendees ({meeting.attendees.length})
              </h3>
              {!isEditingMeta ? (
                <div className="flex flex-wrap gap-2">
                  {meeting.attendees.map((attendee, idx) => {
                    const member = teamMembers.find((m) => m.name === attendee);
                    return (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="px-3 py-1 flex items-center gap-2"
                      >
                        {member?.avatar_url && (
                          <div className="w-4 h-4 rounded-full overflow-hidden relative">
                            <Image
                              src={member.avatar_url}
                              alt={attendee}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        {attendee}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <AttendeeSelector
                  selectedAttendees={metaDraft.attendees}
                  onChange={(attendees) =>
                    setMetaDraft({ ...metaDraft, attendees })
                  }
                  teamMembers={teamMembers}
                />
              )}
            </div>
            {meeting.actionItems.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Recent Actions
                </h3>
                <div className="space-y-2">
                  {meeting.actionItems.slice(0, 5).map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {action.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span
                        className={
                          action.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        {action.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Meeting Notes</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  isEditingNotes ? handleSaveNotes() : setIsEditingNotes(true)
                }
              >
                {isEditingNotes ? "Save Notes" : "Edit Notes"}
              </Button>
            </div>
            {!isEditingNotes ? (
              <div
                className="prose dark:prose-invert prose-sm max-w-none p-4 bg-muted/30 rounded-lg border min-h-[200px]"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    meeting.content || "<p>No notes for this meeting.</p>"
                  ),
                }}
              />
            ) : (
              <RichTextEditor
                value={notesDraft}
                onChange={setNotesDraft}
                placeholder="Write meeting notes..."
              />
            )}
          </div>
        )}

        {tab === "actions" && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <h4 className="text-sm font-medium">Add New Action Item</h4>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs mb-1 block">Description</label>
                  <Input
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="What needs to be done?"
                  />
                </div>
                <div className="w-48">
                  <label className="text-xs mb-1 block">Assignee</label>
                  <select
                    value={aiAssignee}
                    onChange={(e) => setAiAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-40">
                  <label className="text-xs mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={aiDue}
                    onChange={(e) => setAiDue(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddAction}>Add Action</Button>
              </div>
            </div>

            <div className="space-y-3">
              {meeting.actionItems.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <button
                    onClick={() => handleToggleAction(action.id)}
                    className="mt-1"
                  >
                    {action.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${action.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {action.text}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {action.assignedTo || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(action.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
