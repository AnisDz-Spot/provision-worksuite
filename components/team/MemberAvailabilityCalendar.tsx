"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/components/auth/AuthContext";
import {
  getMemberAvailability,
  setMemberAvailability,
  getTeamMembers,
  type MemberAvailability,
} from "@/lib/utils";
import { Calendar, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MemberAvailabilityCalendar() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = React.useState<string[]>([]);
  const [selectedMember, setSelectedMember] = React.useState<string>("");
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [availability, setAvailability] = React.useState<MemberAvailability[]>(
    []
  );
  const [showModal, setShowModal] = React.useState(false);
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] =
    React.useState<MemberAvailability["status"]>("available");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    const teamMembers = getTeamMembers();
    setMembers(teamMembers);
    if (teamMembers.length > 0 && !selectedMember) {
      setSelectedMember(teamMembers[0]);
    }
  }, [selectedMember]);

  React.useEffect(() => {
    if (selectedMember) {
      loadAvailability();
    }
  }, [selectedMember, currentDate]);

  // Auto-refresh availability every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(loadAvailability, 30000);
    return () => clearInterval(interval);
  }, [selectedMember, currentDate]);

  const loadAvailability = () => {
    import("@/lib/dataSource").then(({ shouldUseDatabaseData }) => {
      if (shouldUseDatabaseData()) {
        // Live mode: No API for availability yet, so show empty/nothing instead of mock data
        // Or if we had an API, we would fetch here.
        setAvailability([]);
      } else {
        if (!selectedMember) return;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1).toISOString().slice(0, 10);
        const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);

        const memberAvailability = getMemberAvailability(
          selectedMember,
          startDate,
          endDate
        );
        setAvailability(memberAvailability);
      }
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek, year, month };
  };

  const { daysInMonth, startDayOfWeek, year, month } =
    getDaysInMonth(currentDate);

  const getStatusForDate = (day: number): MemberAvailability["status"] => {
    const dateStr = new Date(year, month, day).toISOString().slice(0, 10);
    const entry = availability.find((a) => a.date === dateStr);
    return entry?.status || "unknown";
  };

  const getNotesForDate = (day: number): string | undefined => {
    const dateStr = new Date(year, month, day).toISOString().slice(0, 10);
    const entry = availability.find((a) => a.date === dateStr);
    return entry?.notes;
  };

  const getStatusColor = (status: MemberAvailability["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500 text-white";
      case "busy":
        return "bg-yellow-500 text-white";
      case "off":
        return "bg-red-500 text-white";
      default:
        return "bg-secondary text-foreground";
    }
  };

  const handleDayClick = (day: number) => {
    if (!isAdmin) return; // Only admin can edit
    setSelectedDay(day);
    const currentStatus = getStatusForDate(day);
    const currentNotes = getNotesForDate(day);
    setSelectedStatus(currentStatus);
    setNotes(currentNotes || "");
    setShowModal(true);
  };

  const handleSaveAvailability = () => {
    if (selectedDay === null || !isAdmin) return;

    const dateStr = new Date(year, month, selectedDay)
      .toISOString()
      .slice(0, 10);

    // Admin sets manual availability (doesn't have [Auto] prefix)
    setMemberAvailability({
      memberName: selectedMember,
      date: dateStr,
      status: selectedStatus,
      notes: notes.trim() || undefined,
    });

    loadAvailability();
    setShowModal(false);
    setSelectedDay(null);
    setNotes("");
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date().toISOString().slice(0, 10);

  if (members.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Member Availability</h3>
          <p className="text-sm text-muted-foreground">No team members found</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Member Availability Calendar
            </h3>
            <div className="flex items-center gap-2">
              {!isAdmin && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>View Only</span>
                </div>
              )}
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          {isAdmin ? (
            <p className="text-xs mb-4 p-2 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded">
              Admin: You can manually override automatic availability.
              Auto-status updates based on member activity.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mb-4 p-2 bg-secondary rounded">
              Availability is automatically tracked based on activity. Contact
              admin for manual changes.
            </p>
          )}{" "}
          {/* Member Selector */}
          <div className="mb-4">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Select Member
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 bg-secondary rounded border border-border text-sm"
            >
              {members.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="secondary" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h4 className="text-lg font-semibold">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h4>
            <Button variant="secondary" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = new Date(year, month, day)
                .toISOString()
                .slice(0, 10);
              const status = getStatusForDate(day);
              const dayNotes = getNotesForDate(day);
              const isToday = dateStr === today;
              const isAuto = dayNotes?.startsWith("[Auto]");

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  disabled={!isAdmin}
                  className={`aspect-square rounded flex flex-col items-center justify-center text-sm font-medium transition-all relative ${getStatusColor(
                    status
                  )} ${isToday ? "ring-2 ring-blue-500" : ""} ${
                    isAdmin
                      ? "hover:ring-2 hover:ring-primary cursor-pointer"
                      : "cursor-default opacity-80"
                  }`}
                  title={
                    isAdmin
                      ? dayNotes
                        ? `${status}: ${dayNotes}`
                        : `Click to set status`
                      : dayNotes
                        ? `${status}: ${dayNotes}`
                        : status
                  }
                >
                  <span>{day}</span>
                  {isAuto && (
                    <span className="absolute top-0.5 right-0.5 text-[8px] opacity-70">
                      A
                    </span>
                  )}
                  {dayNotes && !isAuto && (
                    <span className="absolute bottom-0.5 text-xs">•</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500" />
              <span className="text-muted-foreground">Busy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-muted-foreground">Off/Unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-secondary border border-border" />
              <span className="text-muted-foreground">Unknown</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-4 space-y-1">
            {isAdmin ? (
              <p>
                Click on any day to manually set availability status and add
                notes
              </p>
            ) : (
              <p>Availability is automatically tracked based on activity</p>
            )}
            <p className="flex items-center gap-1">
              <span className="font-mono text-[10px] bg-secondary px-1 rounded">
                A
              </span>{" "}
              = Automatic status
              <span className="mx-2">•</span>
              <span className="text-base">•</span> = Has notes
            </p>
          </div>
        </div>
      </Card>

      {/* Availability Modal - Only for Admin */}
      {isAdmin && (
        <Modal
          open={showModal}
          onOpenChange={(open) => {
            setShowModal(open);
            if (!open) {
              setSelectedDay(null);
              setNotes("");
            }
          }}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {selectedDay
                ? `Set Availability - ${new Date(year, month, selectedDay).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                : "Set Availability"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(
                      e.target.value as MemberAvailability["status"]
                    )
                  }
                  className="w-full px-3 py-2 bg-secondary rounded border border-border"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="off">Off/Unavailable</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about availability..."
                  className="w-full px-3 py-2 bg-secondary rounded border border-border resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedDay(null);
                    setNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAvailability}>
                  Save Availability
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
