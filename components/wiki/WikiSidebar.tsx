"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Plus, FileText, ChevronRight, MoreHorizontal } from "lucide-react";
import { WikiPage } from "@/types/wiki";

interface WikiSidebarProps {
  pages: WikiPage[];
  selectedPageId: string | null;
  onSelect: (pageId: string) => void;
  onCreate: () => void;
}

export function WikiSidebar({
  pages,
  selectedPageId,
  onSelect,
  onCreate,
}: WikiSidebarProps) {
  return (
    <div className="w-64 border-r h-full flex flex-col bg-muted/10">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Pages</h3>
        <Button variant="ghost" size="icon" onClick={onCreate} title="New Page">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pages.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-8">
            No pages yet.
            <br />
            Click + to create one.
          </div>
        )}

        {pages.map((page) => (
          <Button
            key={page.id}
            variant={selectedPageId === page.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-sm h-9 px-2 relative group",
              selectedPageId === page.id
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground"
            )}
            onClick={() => onSelect(page.id)}
          >
            <FileText className="h-4 w-4 mr-2 shrink-0 opacity-70" />
            <span className="truncate">{page.title}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
