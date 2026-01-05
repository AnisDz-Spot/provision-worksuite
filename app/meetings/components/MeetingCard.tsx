import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  MapPin,
  MoreHorizontal,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";

import { Meeting } from "@/app/meetings/types/meeting";

interface MeetingCardProps {
  meeting: Meeting;
  onView: (meeting: Meeting) => void;
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
}

export function MeetingCard({
  meeting,
  onView,
  onEdit,
  onDelete,
  isSelected,
}: MeetingCardProps) {
  return (
    <Card
      className={`p-4 hover:shadow-md transition-shadow cursor-pointer border-2 ${
        isSelected ? "border-purple-600 shadow-md" : "border-transparent"
      }`}
      onClick={() => onView(meeting)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg line-clamp-1 flex-1">
          {meeting.title}
        </h3>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            }
            items={[
              {
                label: "Edit",
                onClick: () => onEdit(meeting),
                icon: <Pencil className="w-4 h-4 mr-2" />,
              },
              {
                label: "Delete",
                onClick: () => onDelete(meeting.id),
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                className: "text-destructive focus:text-destructive",
              },
            ]}
            align="end"
          />
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{new Date(meeting.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            {new Date(meeting.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {meeting.projectId && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>Project: {meeting.projectId}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">
            {meeting.attendees.length} Attendees
          </span>
        </div>
        <div className="flex -space-x-2">
          {meeting.attendees.slice(0, 3).map((attendee, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold overflow-hidden"
              title={attendee}
            >
              {attendee.charAt(0).toUpperCase()}
            </div>
          ))}
          {meeting.attendees.length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-medium">
              +{meeting.attendees.length - 3}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
