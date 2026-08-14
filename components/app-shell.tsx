"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react";
import {
  ArrowLeftRight,
  Code2,
  ExternalLink,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  ReceiptText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { clearSession } from "@/lib/auth/session";
import { AccountsNav } from "@/components/accounts/accounts-nav";
import { navRowClass, navIconClass } from "@/components/nav-styles";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_MAIN: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/transfers/send", label: "Transfers", icon: ArrowLeftRight },
  { href: "/recipients", label: "Recipients", icon: Users },
  { href: "/history", label: "History", icon: ReceiptText },
];

const NAV_FOOTER: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

// External resources (open in a new tab).
const NAV_RESOURCES: NavItem[] = [
  { href: "mailto:support@thiqwave.com", label: "Help & support", icon: LifeBuoy },
  { href: "https://docs.thiqwave.com", label: "API docs", icon: Code2 },
];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(item.href, pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={navRowClass(active)}
    >
      <Icon className={navIconClass(active)} />
      {item.label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const orgQ = useQuery({
    queryKey: ["orgSettings"],
    queryFn: () => api.getOrgSettings(),
  });
  const org = orgQ.data;
  const owner = org?.users[0];

  function logout() {
    clearSession();
    qc.clear();
    router.push("/login");
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface">
        {/* Signed-in identity */}
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-default-soft text-xs font-semibold text-default-soft-foreground">
            {owner ? initials(owner.name) : "—"}
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-foreground">
              {owner?.name ?? "—"}
            </span>
            <span className="truncate text-[11px] text-muted capitalize">
              {owner?.role ?? ""}
            </span>
          </span>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-3">
          <div className="space-y-0.5 pt-1">
            {NAV_MAIN.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>

          <AccountsNav />

          <div className="mt-auto space-y-0.5 pt-4">
            {NAV_FOOTER.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            {NAV_RESOURCES.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={navRowClass(false)}
                >
                  <Icon className={navIconClass(false)} />
                  <span className="flex-1">{item.label}</span>
                  <ExternalLink className="size-3.5 text-[var(--neutral-400)]" />
                </a>
              );
            })}
          </div>
        </nav>

        {/* Brand logo + sign out */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3.5">
          <span
            role="img"
            aria-label="Thiqwave"
            className="block bg-contain bg-left bg-no-repeat"
            style={{
              width: 116,
              height: 18,
              backgroundImage: "url(/thiqwave-logo.svg)",
            }}
          />
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={logout}
            aria-label="Sign out"
            className="text-[var(--neutral-500)]"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <main className="min-w-0 flex-1 px-6 py-8">
        {/* History is a wide data table — let it fill the column. Other pages
            stay in a comfortable reading width. */}
        <div
          className={`mx-auto w-full ${
            pathname === "/history" ? "max-w-none" : "max-w-3xl"
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
