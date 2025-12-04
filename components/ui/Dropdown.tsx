"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface DropdownProps {
  trigger: React.ReactNode;
  items: { label: string; onClick: () => void; icon?: React.ReactNode }[];
  align?: "start" | "end";
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Dropdown({
  trigger,
  items,
  align = "end",
  searchable = false,
  searchPlaceholder = "Search...",
}: DropdownProps) {
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    if (!searchable || !query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((it) => it.label.toLowerCase().includes(q));
  }, [items, searchable, query]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Content
        align={align}
        className="z-50 min-w-[220px] rounded-lg border bg-popover shadow-lg py-2 mt-1 animate-fadeIn"
      >
        {searchable && (
          <div className="px-3 pb-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
            />
          </div>
        )}
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((item, i) => (
            <DropdownMenu.Item
              key={i}
              onSelect={item.onClick}
              className="flex items-center gap-3 px-4 py-2 text-foreground outline-none hover:bg-accent focus:bg-accent cursor-pointer transition-colors"
            >
              {item.icon}
              {item.label}
            </DropdownMenu.Item>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              No results
            </div>
          )}
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}


