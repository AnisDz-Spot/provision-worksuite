"use client";

import { useState, useRef, useMemo } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  label: string;
  value: string;
}

export interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filter and limit options for performance
  const filteredOptions = useMemo(() => {
    const filtered =
      query === ""
        ? options
        : options.filter((option) =>
            option.label.toLowerCase().includes(query.toLowerCase())
          );
    return filtered.slice(0, 50); // Limit to 50 items to prevent UI freeze
  }, [options, query]);

  return (
    <div className={cn("relative", className)}>
      <Combobox
        value={value}
        onChange={(val) => {
          setQuery(""); // Clear query on selection to reset filter
          if (val) onChange(val);
        }}
        disabled={disabled}
      >
        {({ open }) => (
          <>
            <div className="relative w-full cursor-default overflow-hidden rounded-md border border-border bg-input text-left focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm">
              <ComboboxInput
                className={cn(
                  "w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-foreground bg-transparent focus:ring-0",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                displayValue={(val: string) =>
                  options.find((o) => o.value === val)?.label || ""
                }
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => {
                  if (!open && buttonRef.current) {
                    buttonRef.current.click();
                  }
                }}
                placeholder={placeholder}
              />
              <ComboboxButton
                ref={buttonRef}
                className="absolute inset-y-0 right-0 flex items-center pr-2"
              >
                <ChevronsUpDown
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </ComboboxButton>
            </div>
            <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
              {filteredOptions.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none py-2 px-4 text-muted-foreground">
                  Nothing found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <ComboboxOption
                    key={option.value}
                    value={option.value}
                    className={({ focus, selected }) =>
                      cn(
                        "relative cursor-default select-none py-2 pl-10 pr-4",
                        focus
                          ? "bg-accent text-accent-foreground"
                          : "text-popover-foreground",
                        selected ? "bg-accent/50" : ""
                      )
                    }
                  >
                    {({ selected, focus }) => (
                      <>
                        <span
                          className={cn(
                            "block truncate",
                            selected ? "font-medium" : "font-normal"
                          )}
                        >
                          {option.label}
                        </span>
                        {selected ? (
                          <span
                            className={cn(
                              "absolute inset-y-0 left-0 flex items-center pl-3",
                              focus ? "text-accent-foreground" : "text-primary"
                            )}
                          >
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </>
        )}
      </Combobox>
    </div>
  );
}
