import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { Project } from "@/hooks/useProjectDetails";

interface ProjectSidebarProps {
  project: Project;
}

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  const router = useRouter();

  // Member normalization and creator priority
  const processedMembers = React.useMemo(() => {
    const rawMembers = (project.members || []) as any[];
    // If owner isn't in members, add them
    const hasOwner = rawMembers.some((m) => {
      const mName = m.user?.name || m.name;
      const mUid = m.user?.uid || m.uid || m.id;
      return mUid === (project as any).ownerId || mName === project.owner;
    });

    let list = [...rawMembers];
    if (!hasOwner && project.owner && (project as any).ownerId) {
      list.push({
        id: (project as any).ownerId,
        uid: (project as any).ownerId,
        name: project.owner,
        avatarUrl: (project as any).ownerAvatar,
        role: project.ownerRole || "Creator",
        isOwner: true,
      });
    }

    // Role-based sorting hierarchy
    const getRoleWeight = (role: string = "") => {
      const r = role.toLowerCase().replace(/[-_]/g, " ");
      if (r.includes("master admin")) return 1;
      if (r.includes("admin")) return 2;
      if (r.includes("project manager")) return 3;
      return 10;
    };

    // Sort to follow requested hierarchy
    return list.sort((a, b) => {
      const aName = a.user?.name || a.name || "";
      const bName = b.user?.name || b.name || "";
      const aUid = a.user?.uid || a.uid || a.id;
      const bUid = b.user?.uid || b.uid || b.id;
      const aRole = a.user?.role || a.role || "";
      const bRole = b.user?.role || b.role || "";

      const aWeight = getRoleWeight(aRole);
      const bWeight = getRoleWeight(bRole);

      if (aWeight !== bWeight) return aWeight - bWeight;

      // If weights are equal, prioritize owner
      const isAOwner = a.isOwner || aUid === (project as any).ownerId;
      const isBOwner = b.isOwner || bUid === (project as any).ownerId;
      if (isAOwner && !isBOwner) return -1;
      if (!isAOwner && isBOwner) return 1;

      // Fallback to name sorting
      return aName.localeCompare(bName);
    });
  }, [project]);

  const members = processedMembers;

  const categories = Array.isArray(project.categories)
    ? project.categories
    : (project.categories || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const tags = project.tags || [];

  return (
    <div className="space-y-4 sticky top-4 self-start">
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Team Members</h3>
        <div className="space-y-2">
          {members.slice(0, 8).map((m: any, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Image
                src={
                  m.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`
                }
                alt={m.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform"
                title={m.name}
                onClick={() =>
                  router.push(
                    `/team/${m.name.toLowerCase().replace(/\s+/g, "-")}`
                  )
                }
              />
              <button
                className="text-sm hover:underline cursor-pointer"
                onClick={() =>
                  router.push(
                    `/team/${m.name.toLowerCase().replace(/\s+/g, "-")}`
                  )
                }
              >
                {m.name}
              </button>
            </div>
          ))}
          {members.length > 8 && (
            <div className="text-xs text-muted-foreground mt-2">
              +{members.length - 8} more members
            </div>
          )}
        </div>
      </Card>

      {categories.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((c, i) => (
              <Badge key={i} variant="secondary">
                {c}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {tags.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <Badge key={i} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Activity Timeline</h3>
        <div className="text-xs text-muted-foreground">
          <ProjectTimeline projectId={project.uid || project.id} compact />
        </div>
      </Card>
    </div>
  );
}
