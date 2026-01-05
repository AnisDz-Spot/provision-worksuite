import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Image from "next/image";

interface User {
  id: string;
  uid?: string;
  name: string;
  role: string;
  avatar_url?: string | null;
  avatarUrl?: string | null;
}

interface AttendeeSelectorProps {
  selectedAttendees: string[];
  onChange: (attendees: string[]) => void;
  teamMembers: User[];
  id?: string;
  name?: string;
}

export function AttendeeSelector({
  selectedAttendees,
  onChange,
  teamMembers,
  id = "attendee-search",
  name = "attendee-search",
}: AttendeeSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMembers = teamMembers
    .filter((m) => !selectedAttendees.includes(m.name))
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (userName: string) => {
    onChange([...selectedAttendees, userName]);
    setSearch("");
    setIsOpen(false);
  };

  const handleRemove = (userName: string) => {
    onChange(selectedAttendees.filter((a) => a !== userName));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 relative" ref={dropdownRef}>
        <Input
          id={id}
          name={name}
          placeholder="Search to add attendees..."
          value={search}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          className="flex-1"
        />
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover shadow-md">
            {filteredMembers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No matching users found
              </div>
            ) : (
              filteredMembers.map((m) => (
                <div
                  key={m.id || m.uid}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleAdd(m.name)}
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                    {m.avatar_url || m.avatarUrl ? (
                      <Image
                        src={(m.avatar_url || m.avatarUrl)!}
                        alt={m.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium leading-none truncate">
                      {m.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {m.role}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedAttendees.length > 0 && (
        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-200">
          {selectedAttendees.map((attendee, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="flex items-center gap-1 animate-fadeIn"
            >
              {attendee}
              <button
                className="hover:text-destructive ml-1 transition-colors"
                onClick={() => handleRemove(attendee)}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
