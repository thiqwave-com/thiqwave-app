"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card } from "@heroui/react";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { authenticate, DEMO_ACCOUNTS } from "@/lib/auth/accounts";
import { getSession, setSession } from "@/lib/auth/session";
import { TextInputField } from "@/components/ui/text-input-field";

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in → straight to the app.
  useEffect(() => {
    if (getSession()) router.replace("/");
  }, [router]);

  async function onSubmit() {
    if (submitting) return;
    setError(null);
    const account = authenticate(email, password);
    if (!account) {
      setError("Incorrect email or password.");
      return;
    }
    setSubmitting(true);
    // Goes through the seam like every other call: the mock switches the
    // active profile, the live client no-ops.
    await api.switchProfile(account.profile);
    setSession({
      email: account.email,
      name: account.name,
      org: account.org,
      profile: account.profile,
    });
    qc.clear(); // fresh data for the signed-in profile
    router.push("/");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background bg-[url('/login-bg.jpg')] bg-[length:100%] bg-center bg-no-repeat px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/thiqwave-logo.svg"
            alt="Thiqwave"
            width={176}
            height={28}
            className="h-7 w-auto"
          />
        </div>

        <Card className="bg-surface p-12">
          <Card.Content>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <TextInputField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
                autoComplete="email"
              />
              <TextInputField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {error ? (
                <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              ) : null}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isPending={submitting}
              >
                Sign in
              </Button>
            </form>

            <div className="mt-4 rounded-lg bg-default-soft px-3 py-2 text-xs text-muted">
              <p className="mb-1 font-medium text-foreground">Demo credentials</p>
              <p className="font-mono">
                {DEMO_ACCOUNTS[0].email} / {DEMO_ACCOUNTS[0].password}
              </p>
              <p className="mt-1">
                Mocked data only — this sign-in is a client-side gate, not real
                authentication.
              </p>
            </div>
          </Card.Content>
        </Card>

        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}
