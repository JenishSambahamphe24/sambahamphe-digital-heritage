"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "../cn.js";

// Radix reserves "" for "nothing selected", but our forms use "" for real
// choices ("Not given", "Default"); it is swapped for this value internally.
const EMPTY_VALUE = "__empty__";
const ICON_SIZE = 16;
const POPOVER_OFFSET = 4;

export interface ISelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly ISelectOption[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

export function Select({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  invalid = false,
  disabled,
  className,
  ...aria
}: SelectProps) {
  const toRadix = (option: string) => (option === "" ? EMPTY_VALUE : option);
  const hasValue = options.some((option) => option.value === value);
  return (
    <RadixSelect.Root
      value={hasValue ? toRadix(value) : undefined}
      onValueChange={(next) => onValueChange(next === EMPTY_VALUE ? "" : next)}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        id={id}
        aria-invalid={invalid || undefined}
        {...aria}
        className={cn(
          "border-border-strong bg-surface text-foreground flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm",
          "focus-visible:border-focus focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-0",
          "data-[placeholder]:text-foreground-subtle disabled:cursor-not-allowed disabled:opacity-60",
          invalid && "border-danger",
          className,
        )}
      >
        <span className="truncate">
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon className="text-foreground-muted shrink-0">
          <ChevronDown size={ICON_SIZE} aria-hidden />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={POPOVER_OFFSET}
          // Sizes Radix measures at runtime: as wide as the field, no taller than the screen allows.
          style={{
            minWidth: "var(--radix-select-trigger-width)",
            maxHeight: "var(--radix-select-content-available-height)",
          }}
          className="border-border bg-surface text-foreground z-50 overflow-hidden rounded-md border shadow-lg"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={toRadix(option.value)}
                className={cn(
                  "relative flex h-9 cursor-pointer items-center rounded px-8 text-sm outline-none select-none",
                  "data-[highlighted]:bg-surface-muted data-[state=checked]:font-medium",
                )}
              >
                <RadixSelect.ItemIndicator className="text-primary absolute left-2 flex items-center">
                  <Check size={ICON_SIZE} aria-hidden />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
