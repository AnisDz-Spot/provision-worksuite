"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Modal } from "@/components/ui/Modal";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  Calendar,
  Plus,
  Users,
  CheckCircle2,
  Circle,
  Clock,
  X,
  LayoutGrid,
  List,
  MoreVertical,
} from "lucide-react";
import { log } from "@/lib/logger";
import Image from "next/image";

type ActionItem = {
  id: string;
  text: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
};

type Meeting = {
  id: string;
  title: string;
  date: string;
  projectId: string | null;
  attendees: string[];
  content: string;
  actionItems: ActionItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailViewTab, setDetailViewTab] = useState<
    "overview" | "notes" | "actions" | "json"
  >("overview");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [metaDraft, setMetaDraft] = useState<{
    title: string;
    date: string;
    projectId: string | null;
    attendees: string[];
  }>({
    title: "",
    date: new Date().toISOString().slice(0, 16),
    projectId: null,
    attendees: [],
  });
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    // sync contenteditable back into notesDraft
    const el = document.getElementById("notes-editor");
    if (el) setNotesDraft(el.innerHTML);
  };
  const [attendeeInput, setAttendeeInput] = useState("");
  const [teamMembers, setTeamMembers] = useState<
    Array<{ id: string; name: string; role: string; avatarColor?: string }>
  >([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [actionDraftText, setActionDraftText] = useState("");
  const [actionDraftAssignee, setActionDraftAssignee] = useState("");
  const [actionDraftDue, setActionDraftDue] = useState("");
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>(
    []
  );

  const pushToast = (message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  };
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 16),
    projectId: null as string | null,
    content: "",
    attendees: [] as string[],
  });

  useEffect(() => {
    loadMeetings();
    // Load team members
    fetch("/data/users.json")
      .then((res) => res.json())
      .then((data) => setTeamMembers(data))
      .catch((err) => log.error({ err }, "Failed to load team members"));
    // Load projects
    fetch("/data/projects.json")
      .then((res) => res.json())
      .then((data) =>
        setProjects(Array.isArray(data) ? data : data?.projects || [])
      )
      .catch((err) => log.error({ err }, "Failed to load projects"));
  }, []);

  // When opening a meeting, seed notes draft
  useEffect(() => {
    if (selectedMeeting) {
      setNotesDraft(selectedMeeting.content || "");
      setMetaDraft({
        title: selectedMeeting.title,
        date: new Date(selectedMeeting.date).toISOString().slice(0, 16),
        projectId: selectedMeeting.projectId,
        attendees: selectedMeeting.attendees,
      });
      setIsEditingNotes(false);
      setIsEditingMeta(false);
    }
  }, [selectedMeeting]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const getMemberColor = (name: string) => {
    const member = teamMembers.find((m) => m.name === name);
    const color = member?.avatarColor || "gray";
    const map: Record<string, string> = {
      indigo: "bg-indigo-600",
      green: "bg-green-600",
      pink: "bg-pink-600",
      yellow: "bg-yellow-500",
      blue: "bg-blue-600",
      gray: "bg-gray-500",
    };
    return map[color] || map.gray;
  };

  const getAvatarUrl = (name: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Close any open kebab menus on outside click
      setOpenMenuId(null);
    };
    if (openMenuId) {
      document.addEventListener("click", handler);
    }
    return () => document.removeEventListener("click", handler);
  }, [openMenuId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = meetings.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMeetings(filtered);
    } else {
      setFilteredMeetings(meetings);
    }
  }, [searchQuery, meetings]);

  const loadMeetings = async () => {
    try {
      const res = await fetch("/data/meetings.json");
      const data = await res.json();
      setMeetings(data);
      setFilteredMeetings(data);
    } catch (error) {
      log.error({ err: error }, "Failed to load meetings");
    }
  };

  const handleCreateNew = () => {
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      projectId: null,
      content: "",
      attendees: [],
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (isEditing && selectedMeeting) {
      setMeetings(
        meetings.map((m) =>
          m.id === selectedMeeting.id
            ? {
                ...m,
                ...formData,
                date: new Date(formData.date).toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );
    } else {
      const newMeeting: Meeting = {
        id: `meeting-${Date.now()}`,
        ...formData,
        date: new Date(formData.date).toISOString(),
        actionItems: [],
        createdBy: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMeetings([newMeeting, ...meetings]);
    }
    setIsModalOpen(false);
  };

  const toggleActionItem = (meetingId: string, actionId: string) => {
    const updatedMeetings = meetings.map((m) =>
      m.id === meetingId
        ? {
            ...m,
            actionItems: m.actionItems.map((a) =>
              a.id === actionId ? { ...a, completed: !a.completed } : a
            ),
            updatedAt: new Date().toISOString(),
          }
        : m
    );
    setMeetings(updatedMeetings);
    const updatedMeeting =
      updatedMeetings.find((m) => m.id === meetingId) || null;
    setSelectedMeeting(updatedMeeting);
    const action = updatedMeeting?.actionItems.find((a) => a.id === actionId);
    if (
      action?.assignedTo &&
      teamMembers.some((m) => m.name === action.assignedTo)
    ) {
      pushToast(
        `${action.assignedTo} updated: "${action.text}" ${action?.completed ? "completed" : "reopened"}`
      );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section className="p-4 md:p-8">
      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="px-3 py-2 rounded-md bg-card border shadow"
            >
              <span className="text-sm">{t.message}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Meeting Notes</h1>
            <p className="text-sm text-muted-foreground">
              Keep track of meetings and action items
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border px-1 py-1 bg-background">
            <button
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${viewMode === "grid" ? "bg-accent" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${viewMode === "list" ? "bg-accent" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Meeting
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <Input
          type="search"
          placeholder="Search meetings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      <div
        className={
          viewMode === "grid" ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"
        }
      >
        {filteredMeetings.map((meeting) => {
          const completedActions = meeting.actionItems.filter(
            (a) => a.completed
          ).length;
          const totalActions = meeting.actionItems.length;
          const plainText = meeting.content.replace(/<[^>]+>/g, "");
          const excerpt =
            plainText.length > 160 ? plainText.slice(0, 160) + "…" : plainText;

          return (
            <Card
              key={meeting.id}
              className="group relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border bg-background/60 backdrop-blur"
              onClick={() => {
                setSelectedMeeting(meeting);
                setIsModalOpen(false);
              }}
            >
              {/* Gradient background accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-purple-500 via-blue-500 to-indigo-500" />

              <div className="p-6">
                {/* Header with title and metadata */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-purple-600 transition-colors">
                      {meeting.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 rounded-full text-sm">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">
                          {formatDate(meeting.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-full text-sm">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">
                          {meeting.attendees.length} attendees
                        </span>
                      </div>
                      {/* Attendee avatars preview: show only team members */}
                      <div className="flex -space-x-2">
                        {meeting.attendees
                          .filter((a) => teamMembers.some((m) => m.name === a))
                          .slice(0, 3)
                          .map((name, i) => (
                            <Image
                              key={i}
                              src={getAvatarUrl(name)}
                              alt={name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full border-2 border-card"
                            />
                          ))}
                        {meeting.attendees.filter((a) =>
                          teamMembers.some((m) => m.name === a)
                        ).length > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-card bg-gray-500 text-white flex items-center justify-center text-[10px]">
                            +
                            {meeting.attendees.filter((a) =>
                              teamMembers.some((m) => m.name === a)
                            ).length - 3}
                          </div>
                        )}
                      </div>
                      {meeting.projectId && (
                        <Badge variant="secondary" className="px-3 py-1">
                          {meeting.projectId}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Kebab quick actions */}
                  <div className="relative">
                    <button
                      className="p-2 rounded-md hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === meeting.id ? null : meeting.id
                        );
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === meeting.id && (
                      <div
                        className="absolute right-0 mt-2 w-40 bg-card border rounded-md shadow-lg z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-accent"
                          onClick={() => {
                            setIsEditing(true);
                            setIsModalOpen(true);
                            setFormData({
                              title: meeting.title,
                              date: new Date(meeting.date)
                                .toISOString()
                                .slice(0, 16),
                              projectId: meeting.projectId,
                              content: meeting.content,
                              attendees: meeting.attendees,
                            });
                            setOpenMenuId(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-accent"
                          onClick={() => {
                            const duplicate: Meeting = {
                              ...meeting,
                              id: `meeting-${Date.now()}`,
                              title: meeting.title + " (Copy)",
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            };
                            setMeetings([duplicate, ...meetings]);
                            setOpenMenuId(null);
                          }}
                        >
                          Duplicate
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-destructive/20 text-destructive"
                          onClick={() => {
                            setMeetings(
                              meetings.filter((m) => m.id !== meeting.id)
                            );
                            setOpenMenuId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes preview rendered as HTML, clamped with scroll */}
                {meeting.content && (
                  <div className="mb-3">
                    <div
                      className={`prose dark:prose-invert prose-sm ${openMenuId === `expanded-${meeting.id}` ? "" : "max-h-40 overflow-y-hidden"}`}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(meeting.content),
                      }}
                    />
                    <div className="mt-2">
                      <button
                        className="text-xs px-2 py-1 rounded border hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === `expanded-${meeting.id}`
                              ? null
                              : `expanded-${meeting.id}`
                          );
                        }}
                      >
                        {openMenuId === `expanded-${meeting.id}`
                          ? "Show less"
                          : "Read more"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action items summary */}
                {meeting.actionItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold">
                          {completedActions}/{totalActions} Action Items
                          Complete
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-accent rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-green-500 to-emerald-500 transition-all"
                            style={{
                              width: `${totalActions > 0 ? (completedActions / totalActions) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {totalActions > 0
                            ? Math.round(
                                (completedActions / totalActions) * 100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Click to view indicator */}
                <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-center text-xs text-muted-foreground group-hover:text-purple-600 transition-colors">
                  <span className="font-medium">
                    Click to view full details →
                  </span>
                  <span className="text-[11px]">ID: {meeting.id}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedMeeting && !isModalOpen && (
        <Modal
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedMeeting(null);
          }}
          size="full"
        >
          <div className="space-y-4">
            <div className="sticky top-0 bg-card z-10 pb-3 border-b">
              {/* Action buttons moved above for prominence */}
              <div className="flex items-center justify-end gap-2 mb-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMeeting(null)}
                >
                  Close
                </Button>
                {!isEditingMeta ? (
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditingMeta(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingMeta(false);
                        setMetaDraft({
                          title: selectedMeeting.title,
                          date: new Date(selectedMeeting.date)
                            .toISOString()
                            .slice(0, 16),
                          projectId: selectedMeeting.projectId,
                          attendees: selectedMeeting.attendees,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (!selectedMeeting) return;
                        const updated: Meeting = {
                          ...selectedMeeting,
                          title: metaDraft.title,
                          date: new Date(metaDraft.date).toISOString(),
                          projectId: metaDraft.projectId,
                          attendees: metaDraft.attendees,
                          updatedAt: new Date().toISOString(),
                        };
                        setMeetings(
                          meetings.map((m) =>
                            m.id === updated.id ? updated : m
                          )
                        );
                        setSelectedMeeting(updated);
                        setIsEditingMeta(false);
                      }}
                    >
                      Save
                    </Button>
                  </>
                )}
              </div>
              <div className="flex-1">
                {!isEditingMeta ? (
                  <>
                    <h2 className="text-2xl font-bold mb-2">
                      {selectedMeeting.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">
                          {formatDate(selectedMeeting.date)}
                        </span>
                      </div>
                      {selectedMeeting.projectId && (
                        <Badge variant="secondary" className="px-2 py-1">
                          Project: {selectedMeeting.projectId}
                        </Badge>
                      )}
                      <div className="text-[11px] ml-auto">
                        ID: {selectedMeeting.id}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input
                      value={metaDraft.title}
                      onChange={(e) =>
                        setMetaDraft({ ...metaDraft, title: e.target.value })
                      }
                      placeholder="Meeting title"
                    />
                    <Input
                      type="datetime-local"
                      value={metaDraft.date}
                      onChange={(e) =>
                        setMetaDraft({ ...metaDraft, date: e.target.value })
                      }
                    />
                    <div>
                      <select
                        value={metaDraft.projectId || ""}
                        onChange={(e) =>
                          setMetaDraft({
                            ...metaDraft,
                            projectId: e.target.value || null,
                          })
                        }
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm w-full"
                      >
                        <option value="">No Project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id} — {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-muted-foreground mt-1">
                        Select from projects or choose "No Project".
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex flex-wrap gap-2">
                        {metaDraft.attendees.map((a, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="pl-3 pr-1 py-1 flex items-center gap-2"
                          >
                            <span>{a}</span>
                            <button
                              className="hover:bg-destructive/20 rounded-full p-0.5"
                              onClick={() =>
                                setMetaDraft({
                                  ...metaDraft,
                                  attendees: metaDraft.attendees.filter(
                                    (_, idx) => idx !== i
                                  ),
                                })
                              }
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                        <Input
                          placeholder="Add attendee and press Enter"
                          onKeyDown={(e) => {
                            const val = (
                              e.target as HTMLInputElement
                            ).value.trim();
                            if ((e.key === "Enter" || e.key === ",") && val) {
                              e.preventDefault();
                              if (!metaDraft.attendees.includes(val))
                                setMetaDraft({
                                  ...metaDraft,
                                  attendees: [...metaDraft.attendees, val],
                                });
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                        />
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !metaDraft.attendees.includes(val))
                              setMetaDraft({
                                ...metaDraft,
                                attendees: [...metaDraft.attendees, val],
                              });
                            e.currentTarget.value = "";
                          }}
                          className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        >
                          <option value="">+ Add Team Member</option>
                          {teamMembers.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detail view tabs */}
            <div className="mt-4">
              <div className="flex gap-2 mb-4">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "notes", label: "Notes" },
                  { key: "actions", label: "Action Items" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailViewTab(tab.key as any)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      detailViewTab === tab.key
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-background text-muted-foreground hover:bg-accent/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {detailViewTab === "overview" && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Attendees ({selectedMeeting.attendees.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMeeting.attendees.map((attendee, idx) => {
                        const member = teamMembers.find(
                          (m) => m.name === attendee
                        );
                        if (!member) {
                          return (
                            <span key={idx} className="text-sm px-2 py-1">
                              {attendee}
                            </span>
                          );
                        }
                        return (
                          <button
                            key={idx}
                            className="flex items-center gap-2 px-2 py-1 rounded-full border hover:bg-accent"
                            onClick={() => {
                              /* could open member profile later */
                            }}
                          >
                            <img
                              src={getAvatarUrl(member.name)}
                              alt={member.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-sm">{member.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {selectedMeeting.actionItems.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Action Items Summary
                      </h3>
                      <div className="space-y-2">
                        {selectedMeeting.actionItems.map((action) => (
                          <div
                            key={action.id}
                            className="flex items-center gap-3 text-sm"
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
                  {/* Notes preview intentionally omitted per request */}
                </div>
              )}

              {detailViewTab === "notes" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Meeting Notes
                    </div>
                    <div className="flex gap-2">
                      {!isEditingNotes ? (
                        <Button
                          variant="secondary"
                          onClick={() => setIsEditingNotes(true)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditingNotes(false);
                              setNotesDraft(selectedMeeting.content || "");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              if (!selectedMeeting) return;
                              const updated = {
                                ...selectedMeeting,
                                content: notesDraft,
                                updatedAt: new Date().toISOString(),
                              };
                              setMeetings(
                                meetings.map((m) =>
                                  m.id === updated.id ? updated : m
                                )
                              );
                              setSelectedMeeting(updated);
                              setIsEditingNotes(false);
                            }}
                          >
                            Save
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {!isEditingNotes ? (
                    <div
                      className="prose dark:prose-invert prose-sm max-h-[60vh] overflow-y-auto p-4 bg-accent/10 rounded-lg border"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(selectedMeeting.content),
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

              {detailViewTab === "actions" && (
                <div className="space-y-2">
                  {/* Add new action item */}
                  <div className="flex flex-wrap gap-2 items-end p-3 border rounded-lg bg-background">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs">Action</label>
                      <Input
                        value={actionDraftText}
                        onChange={(e) => setActionDraftText(e.target.value)}
                        placeholder="e.g., Prepare sprint demo"
                      />
                    </div>
                    <div className="min-w-40">
                      <label className="text-xs">Assigned To</label>
                      <select
                        value={actionDraftAssignee}
                        onChange={(e) => setActionDraftAssignee(e.target.value)}
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm w-full"
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-40">
                      <label className="text-xs">Due Date</label>
                      <Input
                        type="date"
                        value={actionDraftDue}
                        onChange={(e) => setActionDraftDue(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!selectedMeeting || !actionDraftText.trim()) return;
                        const newItem: ActionItem = {
                          id: `ai-${Date.now()}`,
                          text: actionDraftText.trim(),
                          assignedTo: actionDraftAssignee || "",
                          dueDate: actionDraftDue || new Date().toISOString(),
                          completed: false,
                        };
                        const updated = {
                          ...selectedMeeting,
                          actionItems: [
                            newItem,
                            ...selectedMeeting.actionItems,
                          ],
                          updatedAt: new Date().toISOString(),
                        };
                        setMeetings(
                          meetings.map((m) =>
                            m.id === updated.id ? updated : m
                          )
                        );
                        setSelectedMeeting(updated);
                        setActionDraftText("");
                        setActionDraftAssignee("");
                        setActionDraftDue("");
                        if (
                          newItem.assignedTo &&
                          teamMembers.some((m) => m.name === newItem.assignedTo)
                        ) {
                          pushToast(
                            `${newItem.assignedTo} assigned: "${newItem.text}"`
                          );
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {selectedMeeting.actionItems.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-accent/20"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActionItem(selectedMeeting.id, action.id);
                        }}
                        className="mt-0.5 cursor-pointer"
                      >
                        {action.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${action.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {action.text}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Assigned to: {action.assignedTo}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              Due:{" "}
                              {new Date(action.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailViewTab === "json" && (
                <pre className="max-h-[60vh] overflow-y-auto bg-background border border-border rounded-lg p-4 text-xs whitespace-pre-wrap">
                  {JSON.stringify(selectedMeeting, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} size="lg">
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
            <label className="block text-sm font-medium mb-2">
              Date & Time
            </label>
            <Input
              type="datetime-local"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <RichTextEditor
              value={formData.content}
              onChange={(html) => setFormData({ ...formData, content: html })}
              placeholder="Write meeting notes..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Attendees</label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      (e.key === "Enter" || e.key === ",") &&
                      attendeeInput.trim()
                    ) {
                      e.preventDefault();
                      const name = attendeeInput.trim().replace(/,$/g, "");
                      if (name && !formData.attendees.includes(name)) {
                        setFormData({
                          ...formData,
                          attendees: [...formData.attendees, name],
                        });
                      }
                      setAttendeeInput("");
                    }
                  }}
                  placeholder="Type name and press Enter or comma"
                  className="flex-1"
                />
                <select
                  value=""
                  onChange={(e) => {
                    if (
                      e.target.value &&
                      !formData.attendees.includes(e.target.value)
                    ) {
                      setFormData({
                        ...formData,
                        attendees: [...formData.attendees, e.target.value],
                      });
                    }
                  }}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="">+ Add Team Member</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              {formData.attendees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.attendees.map((attendee, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="pl-3 pr-1 py-1 flex items-center gap-2"
                    >
                      <span>{attendee}</span>
                      <button
                        onClick={() => {
                          setFormData({
                            ...formData,
                            attendees: formData.attendees.filter(
                              (_, i) => i !== idx
                            ),
                          });
                        }}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Save Changes" : "Create Meeting"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
