"use client";

import type { Key, ReactNode } from "react";
import { Select, ListBox } from "@heroui/react";
import { StatusTag } from "@/components/status-tag";

export interface IconOption {
  id: string;
  label: string;
  icon?: ReactNode;
  comingSoon?: boolean;
}

/**
 * Select that renders an icon inside the trigger and each option (HeroUI v3
 * Select + ListBox). Options flagged `comingSoon` are disabled and show a
 * "Coming soon" badge.
 */
export function IconSelect({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: IconOption[];
  className?: string;
  ariaLabel?: string;
}) {
  const selected = options.find((o) => o.id === value);
  return (
    <Select
      className={className}
      variant="secondary"
      aria-label={ariaLabel}
      value={value}
      onChange={(key: Key | null) => {
        if (key != null) onChange(String(key));
      }}
    >
      <Select.Trigger>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selected?.icon}
          <span className="truncate">{selected?.label ?? ""}</span>
        </span>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBox.Item
              key={o.id}
              id={o.id}
              textValue={o.label}
              isDisabled={o.comingSoon}
            >
              <span className="flex flex-1 items-center gap-2">
                {o.icon}
                <span className="flex-1">{o.label}</span>
                {o.comingSoon ? <StatusTag variant="coming_soon" /> : null}
              </span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
