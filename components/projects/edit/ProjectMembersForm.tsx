import { Project } from "@/hooks/useProjectEditData";
import { X } from "lucide-react";
import Image from "next/image";

interface ProjectMembersFormProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  users: any[];
}

export function ProjectMembersForm({
  project,
  setProject,
  users,
}: ProjectMembersFormProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Team Members</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {(project.members || []).map((m, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 bg-accent px-2 py-1 rounded-md"
          >
            <Image
              src={
                m.avatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`
              }
              alt={m.name}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-xs">{m.name}</span>
            <button
              onClick={() => {
                setProject((p) =>
                  p
                    ? {
                        ...p,
                        members: (p.members || []).filter((_, i) => i !== idx),
                      }
                    : p
                );
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <select
        className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
        onChange={(e) => {
          const selected = users.find((u) => u.name === e.target.value);
          if (
            selected &&
            !project.members?.find((m) => m.uid === selected.uid)
          ) {
            setProject((p) =>
              p
                ? {
                    ...p,
                    members: [
                      ...(p.members || []),
                      {
                        uid: selected.uid,
                        name: selected.name,
                        avatarUrl:
                          selected.avatarUrl ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selected.name)}`,
                      },
                    ],
                  }
                : p
            );
          }
          e.target.value = "";
        }}
        value=""
      >
        <option value="">Select members…</option>
        {users.map((u) => (
          <option key={u.uid} value={u.name}>
            {u.name} ({u.role})
          </option>
        ))}
      </select>
    </div>
  );
}
