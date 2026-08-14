"use client";

import { useState } from "react";
import { Card } from "@heroui/react";
import { SelectField } from "@/components/ui/select-field";
import { ResetDemo } from "@/components/reset-demo";

const LANGS = [
  { id: "en", label: "English" },
  { id: "ar", label: "العربية (Arabic)" },
  { id: "fr", label: "Français" },
];
const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

export default function PreferencesSettingsPage() {
  const [lang, setLang] = useState("en");
  const [theme, setTheme] = useState("light");

  return (
    <div className="space-y-4">
      <Card className="bg-surface">
        <Card.Header>
          <Card.Title>Preferences</Card.Title>
          <Card.Description>Appearance and language.</Card.Description>
        </Card.Header>
        <Card.Content className="gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Language</p>
              <p className="text-xs text-muted">Interface language.</p>
            </div>
            <SelectField
              className="w-52"
              ariaLabel="Language"
              value={lang}
              onChange={setLang}
              options={LANGS}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted">Light is the default.</p>
            </div>
            <SelectField
              className="w-52"
              ariaLabel="Theme"
              value={theme}
              onChange={setTheme}
              options={THEMES}
            />
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-surface">
        <Card.Header>
          <Card.Title>Demo</Card.Title>
          <Card.Description>
            Mocked demo data, persisted locally. Reset restores the seed.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <ResetDemo />
        </Card.Content>
      </Card>
    </div>
  );
}
