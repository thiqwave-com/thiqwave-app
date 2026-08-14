import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="mb-5 font-display text-3xl font-semibold tracking-tight text-foreground">
        Settings
      </h1>
      <div className="flex flex-col gap-6 sm:flex-row">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
