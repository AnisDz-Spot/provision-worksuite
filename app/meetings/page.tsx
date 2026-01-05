"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Plus, LayoutGrid, List, Calendar } from "lucide-react";
import { log } from "@/lib/logger";
import { Modal } from "@/components/ui/Modal";

// Sub-components
import { MeetingCard } from "./components/MeetingCard";
import { MeetingModal } from "./components/MeetingModal";
import { MeetingDetailView } from "./components/MeetingDetailView";

import { Meeting, ActionItem } from "./types/meeting";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [teamMembers, setTeamMembers] = useState<
    Array<{
      id: string;
      name: string;
      role: string;
      avatar_url?: string | null;
    }>
  >([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    []
  );

  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 16),
    projectId: null as string | null,
    content: "",
    attendees: [] as string[],
  });

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

  const isRealMode = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pv:dataMode") === "real";
  };

  useEffect(() => {
    loadMeetings();
    loadTeamMembers();
    loadProjects();
  }, []);

  const loadMeetings = async () => {
    try {
      const endpoint = isRealMode() ? "/api/meetings" : "/data/meetings.json";
      const res = await fetch(endpoint);
      const data = await res.json();
      setMeetings(Array.isArray(data) ? data : []);
      setFilteredMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      log.error({ err }, "Failed to load meetings");
    }
  };

  const loadTeamMembers = async () => {
    try {
      if (isRealMode()) {
        const res = await fetch("/api/users");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTeamMembers(json.data);
        }
      } else {
        const res = await fetch("/data/users.json");
        const data = await res.json();
        setTeamMembers(data);
      }
    } catch (err) {
      log.error({ err }, "Failed to load team members");
    }
  };

  const loadProjects = async () => {
    try {
      const endpoint = isRealMode() ? "/api/projects" : "/data/projects.json";
      const res = await fetch(endpoint);
      const data = await res.json();
      const projectsData = Array.isArray(data) ? data : data?.projects || [];
      setProjects(projectsData);
    } catch (err) {
      log.error({ err }, "Failed to load projects");
    }
  };

  useEffect(() => {
    const filtered = meetings.filter((m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMeetings(filtered);
  }, [searchQuery, meetings]);

  const handleCreateNew = () => {
    setFormData({
      title: "",
      date: new Date().toISOString().slice(0, 16),
      projectId: null,
      content: "",
      attendees: [],
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (meeting: Meeting) => {
    setFormData({
      title: meeting.title,
      date: new Date(meeting.date).toISOString().slice(0, 16),
      projectId: meeting.projectId,
      content: meeting.content,
      attendees: meeting.attendees,
    });
    setIsEditing(true);
    setIsModalOpen(true);
    setSelectedMeeting(meeting);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    try {
      if (isRealMode()) {
        await fetch(`/api/meetings?id=${id}`, { method: "DELETE" });
      }
      setMeetings(meetings.filter((m) => m.id !== id));
      pushToast("Meeting deleted");
    } catch (err) {
      log.error({ err }, "Failed to delete meeting");
      pushToast("Failed to delete meeting");
    }
  };

  const handleView = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsDetailModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (isRealMode()) {
        const payload = {
          id: isEditing && selectedMeeting ? selectedMeeting.id : undefined,
          ...formData,
          date: new Date(formData.date).toISOString(),
          actionItems:
            isEditing && selectedMeeting ? selectedMeeting.actionItems : [],
        };
        const res = await fetch("/api/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const saved = await res.json();
        if (saved.id) {
          loadMeetings();
          setIsModalOpen(false);
          pushToast(isEditing ? "Meeting updated" : "Meeting created");
        }
      } else {
        if (isEditing && selectedMeeting) {
          const updated = meetings.map((m) =>
            m.id === selectedMeeting.id
              ? ({
                  ...m,
                  ...formData,
                  date: new Date(formData.date).toISOString(),
                } as Meeting)
              : m
          );
          setMeetings(updated);
        } else {
          const newMeeting = {
            ...formData,
            id: `meeting-${Date.now()}`,
            date: new Date(formData.date).toISOString(),
            actionItems: [],
            createdBy: "user-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Meeting;
          setMeetings([newMeeting, ...meetings]);
        }
        setIsModalOpen(false);
        pushToast(isEditing ? "Meeting updated" : "Meeting created");
      }
    } catch (err) {
      log.error({ err }, "Failed to save meeting");
      pushToast("Failed to save meeting");
    }
  };

  const handleUpdateFromDetail = (updated: Meeting) => {
    setMeetings(meetings.map((m) => (m.id === updated.id ? updated : m)));
    setSelectedMeeting(updated);
    if (isRealMode()) {
      fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).catch((err) => log.error({ err }, "Failed to sync details update"));
    }
  };

  return (
    <section className="p-4 md:p-8">
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="px-4 py-2 rounded-md bg-card border shadow-lg animate-in slide-in-from-right"
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Meetings & Notes
          </h1>
          <p className="text-muted-foreground mt-1">
            Capture discussions, decisions, and action items.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex border rounded-lg p-1 bg-muted/50">
            <button
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Meeting
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6 sticky top-0 z-10 bg-background/95 backdrop-blur">
        <Input
          type="search"
          placeholder="Search meetings by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {filteredMeetings.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
          <div className="p-4 rounded-full bg-muted inline-flex mb-4">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No meetings found</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            {searchQuery
              ? "No meetings match your current search query."
              : "Keep your team aligned by scheduling and documenting meetings."}
          </p>
          <Button onClick={handleCreateNew} variant="outline">
            Schedule First Meeting
          </Button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-4"
          }
        >
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isSelected={selectedMeeting?.id === meeting.id}
            />
          ))}
        </div>
      )}

      {/* New/Edit Modal */}
      <MeetingModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        isEditing={isEditing}
        formData={formData}
        setFormData={setFormData}
        teamMembers={teamMembers}
        projects={projects}
        onSave={handleSave}
      />

      {/* Detail View Modal */}
      {selectedMeeting && (
        <Modal
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          size="xl"
        >
          <MeetingDetailView
            meeting={selectedMeeting}
            teamMembers={teamMembers}
            onUpdate={handleUpdateFromDetail}
            onRefresh={loadMeetings}
          />
        </Modal>
      )}
    </section>
  );
}
