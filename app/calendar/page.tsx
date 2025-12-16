"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Note = {
  text: string;
  color: string;
  type: "note" | "event" | "reminder";
};
const LS_KEY = "pv:calendar-notes";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Use UTC date construction to avoid timezone/DST shifting that can cause
// overlapping days (e.g., 1st & 2nd appearing in same cell in some locales).
function makeUTC(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day));
}
function startOfMonth(d: Date) {
  return makeUTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}
function endOfMonth(d: Date) {
  return makeUTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
}
function fmtISO(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [notes, setNotes] = useState<Record<string, Note[]>>({});
  const [open, setOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftColor, setDraftColor] = useState("#3b82f6");
  const [draftType, setDraftType] = useState<"note" | "event" | "reminder">(
    "note"
  );
  const [selectedISO, setSelectedISO] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const monthGrid = useMemo(() => {
    const start = startOfMonth(current);
    const end = endOfMonth(current);
    const startDay = start.getUTCDay();
    const daysInMonth = end.getUTCDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(makeUTC(current.getUTCFullYear(), current.getUTCMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [current]);

  const monthLabel = current.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
  const monthISO = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
  const monthNotes = Object.entries(notes)
    .filter(([k]) => k.startsWith(monthISO))
    .sort(([a], [b]) => (a < b ? -1 : 1));

  function openAdd(d: Date) {
    setSelectedISO(fmtISO(d));
    setDraftText("");
    setDraftColor("#3b82f6");
    setDraftType("note");
    setOpen(true);
  }

  function saveNote() {
    if (!selectedISO || !draftText.trim()) {
      setOpen(false);
      return;
    }
    setNotes((prev) => {
      const dayNotes = prev[selectedISO] ? [...prev[selectedISO]] : [];
      dayNotes.push({
        text: draftText.trim(),
        color: draftColor,
        type: draftType,
      });
      return { ...prev, [selectedISO]: dayNotes };
    });
    setOpen(false);
  }

  function deleteNote(iso: string, idx: number) {
    setNotes((prev) => {
      const dayNotes = prev[iso] ? [...prev[iso]] : [];
      dayNotes.splice(idx, 1);
      if (dayNotes.length === 0) {
        const { [iso]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [iso]: dayNotes };
    });
  }

  function toggleExpand(iso: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedDay(expandedDay === iso ? null : iso);
  }

  return (
    <section className="p-4 md:p-8 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" /> Calendar
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded hover:bg-accent cursor-pointer"
            aria-label="Prev"
            onClick={() =>
              setCurrent(
                makeUTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1)
              )
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-medium px-2">{monthLabel}</div>
          <button
            className="p-2 rounded hover:bg-accent cursor-pointer"
            aria-label="Next"
            onClick={() =>
              setCurrent(
                makeUTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1)
              )
            }
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-7 bg-accent/10 rounded-xl overflow-hidden shadow text-center">
            {DAYS.map((day) => (
              <div
                key={day}
                className="font-semibold py-2 bg-accent/40 text-accent-foreground border-b border-border"
              >
                {day}
              </div>
            ))}
            {monthGrid.map((d, i) => {
              const iso = d ? fmtISO(d) : null;
              const dayNotes = iso ? notes[iso] || [] : [];
              const isToday = d && fmtISO(d) === fmtISO(new Date());
              const isExpanded = iso === expandedDay;
              const hasMore = dayNotes.length > 2;
              return (
                <div
                  key={i}
                  className={`relative ${d && isExpanded ? "row-span-2 col-span-1" : ""} ${d && isExpanded ? "h-auto" : "h-28"} flex flex-col p-3 border-b border-r ${isToday ? "border-2 border-primary bg-primary/5" : "border-border bg-card"} text-sm ${d ? "cursor-pointer hover:bg-accent/5" : "opacity-40"}`}
                  onClick={() => d && openAdd(d)}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-foreground ${isToday ? "font-bold text-primary" : ""}`}
                    >
                      {d?.getDate() || ""}
                    </span>
                    {d && (
                      <button
                        className="p-1 rounded hover:bg-accent cursor-pointer"
                        title="Add note"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAdd(d);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="mt-1 flex-1 space-y-1 overflow-hidden">
                    {(isExpanded ? dayNotes : dayNotes.slice(0, 2)).map(
                      (n, idx) => (
                        <div
                          key={idx}
                          className="group flex items-center gap-1 text-[11px] px-1 py-0.5 rounded hover:bg-accent/20"
                          style={{
                            backgroundColor: `${n.color}22`,
                            color: n.color,
                          }}
                        >
                          <span className="truncate flex-1">
                            {n.type === "event"
                              ? "📅"
                              : n.type === "reminder"
                                ? "⏰"
                                : "📝"}{" "}
                            {n.text}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(iso!, idx);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/20 rounded cursor-pointer"
                            title="Delete"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    )}
                    {hasMore && !isExpanded && (
                      <button
                        className="text-[10px] text-primary hover:underline w-full text-left cursor-pointer"
                        onClick={(e) => iso && toggleExpand(iso, e)}
                      >
                        +{dayNotes.length - 2} more
                      </button>
                    )}
                    {isExpanded && hasMore && (
                      <button
                        className="text-[10px] text-primary hover:underline w-full text-left mt-2 cursor-pointer"
                        onClick={(e) => iso && toggleExpand(iso, e)}
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="font-semibold">This Month</h2>
          <div className="rounded-xl border bg-card p-3 max-h-80 overflow-auto">
            {monthNotes.length === 0 && (
              <div className="text-sm text-muted-foreground">No notes yet</div>
            )}
            {monthNotes.map(([iso, arr]) => (
              <div key={iso} className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">{iso}</div>
                <div className="flex flex-col gap-1">
                  {arr.map((n, i) => (
                    <div
                      key={i}
                      className="group flex items-center gap-2 text-xs px-2 py-1 rounded border hover:bg-accent/10"
                      style={{ borderColor: `${n.color}66` }}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: n.color }}
                      />
                      <span className="flex-1 truncate">
                        {n.type === "event"
                          ? "📅"
                          : n.type === "reminder"
                            ? "⏰"
                            : "📝"}{" "}
                        {n.text}
                      </span>
                      <button
                        onClick={() => deleteNote(iso, i)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded cursor-pointer"
                        title="Delete"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={open} onOpenChange={setOpen} size="sm">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Add Item</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select
              value={draftType}
              onChange={(e) => setDraftType(e.target.value as any)}
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm cursor-pointer"
            >
              <option value="note">📝 Note</option>
              <option value="event">📅 Event</option>
              <option value="reminder">⏰ Reminder</option>
            </select>
          </div>
          <Input
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Text..."
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground">Color</label>
            <input
              type="color"
              value={draftColor}
              onChange={(e) => setDraftColor(e.target.value)}
              className="h-10 w-14 rounded border"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={saveNote}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}



