"use client";

import { TextField, Label, Input, FieldError, Description } from "@heroui/react";

/** Thin wrapper over HeroUI v3 TextField (Label + Input + error/description). */
export function TextInputField({
  label,
  value,
  onChange,
  placeholder,
  isInvalid,
  error,
  description,
  isRequired,
  inputMode,
  type,
  autoComplete,
  mono,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isInvalid?: boolean;
  error?: string;
  description?: string;
  isRequired?: boolean;
  inputMode?: "text" | "decimal" | "numeric" | "email" | "tel";
  type?: "text" | "password" | "email";
  autoComplete?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <TextField
      className={className}
      variant="secondary"
      value={value}
      onChange={onChange}
      isInvalid={isInvalid}
      isRequired={isRequired}
    >
      <Label>{label}</Label>
      <Input
        placeholder={placeholder}
        inputMode={inputMode}
        type={type}
        autoComplete={autoComplete}
        className={mono ? "font-mono" : undefined}
      />
      {isInvalid && error ? (
        <FieldError>{error}</FieldError>
      ) : description ? (
        <Description>{description}</Description>
      ) : null}
    </TextField>
  );
}
