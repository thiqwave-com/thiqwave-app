"use client";

import { RadioGroup, Radio, Label } from "@heroui/react";

export interface RadioOption {
  id: string;
  label: string;
  description?: string;
}

/** Thin wrapper over HeroUI v3 RadioGroup. */
export function RadioField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  className?: string;
}) {
  return (
    <RadioGroup className={className} value={value} onChange={onChange}>
      {label ? <Label>{label}</Label> : null}
      {options.map((o) => (
        <Radio key={o.id} value={o.id}>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          <Radio.Content>
            <Label>{o.label}</Label>
            {o.description ? (
              <span className="text-xs text-muted">{o.description}</span>
            ) : null}
          </Radio.Content>
        </Radio>
      ))}
    </RadioGroup>
  );
}
