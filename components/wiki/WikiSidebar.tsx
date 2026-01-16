"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  FileText,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  FolderOpen,
  Folder,
} from "lucide-react";
import { WikiPage } from "@/types/wiki";
import { Dropdown } from "@/components/ui/Dropdown";

interface WikiSidebarProps {
  pages: WikiPage[];
  selectedPageId: string | null;
  onSelect: (pageId: string) => void;
  onCreate: (parentId?: string | null) => void;
}

interface PageNode extends WikiPage {
  childrenNodes: PageNode[];
}

export function WikiSidebar({
  pages,
  selectedPageId,
  onSelect,
  onCreate,
}: WikiSidebarProps) {
  // Build Tree
  const tree = useMemo(() => {
    const nodes: Record<string, PageNode> = {};
    const roots: PageNode[] = [];

    // Initialize nodes
    pages.forEach((page) => {
      nodes[page.id] = { ...page, childrenNodes: [] };
    });

    // Build hierarchy
    pages.forEach((page) => {
      if (page.parentId && nodes[page.parentId]) {
        nodes[page.parentId].childrenNodes.push(nodes[page.id]);
      } else {
        roots.push(nodes[page.id]);
      }
    });

    return roots;
  }, [pages]);

  return (
    <div className="w-64 border-r h-full flex flex-col bg-muted/10">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Pages</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCreate(null)}
          title="New Top-level Page"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {pages.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-8">
            No pages yet.
            <br />
            Click + to create one.
          </div>
        )}

        {tree.map((node) => (
          <WikiPageItem
            key={node.id}
            node={node}
            selectedPageId={selectedPageId}
            onSelect={onSelect}
            onCreate={onCreate}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

interface WikiPageItemProps {
  node: PageNode;
  selectedPageId: string | null;
  onSelect: (pageId: string) => void;
  onCreate: (parentId?: string | null) => void;
  depth: number;
}

function WikiPageItem({
  node,
  selectedPageId,
  onSelect,
  onCreate,
  depth,
}: WikiPageItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.childrenNodes.length > 0;
  const isSelected = selectedPageId === node.id;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center h-8 px-2 rounded-md hover:bg-accent/50 cursor-pointer text-sm",
          isSelected
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Expand/Collapse Toggle */}
        <div
          className="w-4 h-4 mr-1 flex items-center justify-center shrink-0 hover:bg-black/5 dark:hover:bg-white/10 rounded"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            ))}
        </div>

        {/* Page Icon & Title */}
        <div
          className="flex-1 flex items-center min-w-0"
          onClick={() => onSelect(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-3.5 w-3.5 mr-2 opacity-70" />
            ) : (
              <Folder className="h-3.5 w-3.5 mr-2 opacity-70" />
            )
          ) : (
            <FileText className="h-3.5 w-3.5 mr-2 opacity-70" />
          )}
          <span className="truncate">{node.title}</span>
        </div>

        {/* Context Menu (Create Sub-page) */}
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            }
            items={[
              {
                label: "New Sub-page",
                icon: <Plus className="h-4 w-4" />,
                onClick: () => onCreate(node.id),
              },
            ]}
          />
        </div>
      </div>

      {/* Children */}
      {isExpanded && node.childrenNodes.length > 0 && (
        <div className="mt-0.5">
          {node.childrenNodes.map((child) => (
            <WikiPageItem
              key={child.id}
              node={child}
              selectedPageId={selectedPageId}
              onSelect={onSelect}
              onCreate={onCreate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
