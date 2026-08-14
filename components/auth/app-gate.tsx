"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";

/** Gates the authenticated app: no demo session → redirect to /login. */
export function AppGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getSession()) setReady(true);
    else router.replace("/login");
  }, [router]);

  if (!ready) return null;
  return <AppShell>{children}</AppShell>;
}
