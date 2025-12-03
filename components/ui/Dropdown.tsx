"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface DropdownProps {
  trigger: React.ReactNode;
  items: { label: string; onClick: () => void; icon?: React.ReactNode }[];
  align?: "start" | "end";
}

export function Dropdown({ trigger, items, align = "end" }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Content
        align={align}
        className="z-50 min-w-[180px] rounded-lg border bg-popover shadow-lg py-2 mt-1 animate-fadeIn"
      >
        {items.map((item, i) => (
          <DropdownMenu.Item
            key={i}
            onSelect={item.onClick}
            className="flex items-center gap-3 px-4 py-2 text-foreground outline-none hover:bg-accent focus:bg-accent cursor-pointer transition-colors"
          >
            {item.icon}
            {item.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
