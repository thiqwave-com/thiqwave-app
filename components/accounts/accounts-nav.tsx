"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FiatRail } from "@/lib/api";
import { formatAmount } from "@/lib/money";
import { CircleFlag } from "@/components/circle-flag";
import { navRowClass } from "@/components/nav-styles";
import { RollingNumber } from "@/components/rolling-number";

type AccountDef = {
  rail: FiatRail;
  href: string;
  name: string;
  flagCode: string;
  symbol: string;
};

export const FIAT_ACCOUNTS: AccountDef[] = [
  { rail: "USD_VIBAN", href: "/accounts/usd", name: "US Dollar", flagCode: "us", symbol: "$" },
  { rail: "AED_VIBAN", href: "/accounts/aed", name: "UAE Dirham", flagCode: "ae", symbol: "AED " },
];

/** Sidebar "Accounts" section: the org's fiat (virtual IBAN) accounts with their
 *  balances, each linking to its detail page. Hidden when there are none. */
export function AccountsNav() {
  const pathname = usePathname();
  const positionsQ = useQuery({
    queryKey: ["positions"],
    queryFn: () => api.getPositions(),
  });
  const positions = positionsQ.data ?? [];

  const rows = FIAT_ACCOUNTS.map((a) => ({
    ...a,
    pos: positions.find((p) => p.asset === a.rail),
  })).filter((a) => a.pos);

  if (rows.length === 0) return null;

  return (
    <div>
      <p className="px-3 pt-5 pb-1.5 text-[11px] font-medium tracking-wide text-muted uppercase">
        Accounts
      </p>
      <div className="space-y-0.5">
        {rows.map((a) => {
          const active = pathname.startsWith(a.href);
          return (
            <Link
              key={a.rail}
              href={a.href}
              aria-current={active ? "page" : undefined}
              className={navRowClass(active)}
            >
              <CircleFlag code={a.flagCode} size={26} />
              <span className="flex min-w-0 flex-col leading-tight">
                <RollingNumber
                  value={`${a.symbol}${formatAmount(a.pos!.amount, 0)}`}
                  animateOnMount={false}
                  className="font-display text-sm font-medium"
                />
                <span className="text-xs text-[var(--neutral-500)]">
                  {a.name}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
