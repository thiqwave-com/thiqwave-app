"use client";

import type { Key } from "react";
import { Select, Label, ListBox } from "@heroui/react";

export interface SelectOption {
  id: string;
  label: string;
  disabled?: boolean;
}

/**
 * Thin wrapper over HeroUI v3's compositional Select for option-list selects.
 * `variant` defaults to "secondary" (the flat in-surface fill, for selects inside
 * cards); pass "primary" for selects sitting on the page background (e.g. table
 * filters) so they read as white controls.
 */
export function SelectField({
  label,
  ariaLabel,
  placeholder,
  value,
  onChange,
  options,
  isRequired,
  className,
  variant = "secondary",
}: {
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  isRequired?: boolean;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Select
      className={className}
      variant={variant}
      aria-label={!label ? ariaLabel : undefined}
      placeholder={placeholder}
      isRequired={isRequired}
      value={value}
      onChange={(key: Key | null) => {
        if (key != null) onChange(String(key));
      }}
    >
      {label ? <Label>{label}</Label> : null}
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBox.Item
              key={o.id}
              id={o.id}
              textValue={o.label}
              isDisabled={o.disabled}
            >
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
