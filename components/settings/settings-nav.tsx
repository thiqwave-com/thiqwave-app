"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@heroui/react";

const SECTIONS = [
  {
    title: "Account",
    items: [
      { href: "/settings/account", label: "Account details" },
      { href: "/settings/wallets", label: "Wallets" },
      { href: "/settings/security", label: "Security" },
      { href: "/settings/preferences", label: "Preferences" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/settings/verification", label: "Verification" },
      { href: "/settings/maker-checker", label: "Maker-checker" },
      { href: "/settings/users", label: "Users" },
    ],
  },
  {
    title: "Developers",
    items: [
      { href: "/settings/api-keys", label: "API keys" },
      { href: "/settings/documentation", label: "Documentation" },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="w-full shrink-0 sm:w-48">
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="px-3 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-[var(--neutral-100)] font-medium text-foreground"
                      : "text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
