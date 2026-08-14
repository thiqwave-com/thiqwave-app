import Link from "next/link";
import { Card } from "@heroui/react";
import { Mail } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/thiqwave-logo.svg"
            alt="Thiqwave"
            width={176}
            height={28}
            className="h-7 w-auto"
          />
          <p className="text-sm text-muted">Request access</p>
        </div>

        <Card className="bg-surface">
          <Card.Header>
            <Card.Title>We&apos;re in closed beta</Card.Title>
            <Card.Description>
              Thiqwave onboards a small number of selected institutions at a time.
            </Card.Description>
          </Card.Header>
          <Card.Content className="gap-3">
            <p className="text-sm text-muted">
              There&apos;s no public sign-up yet. If you&apos;re a family office or
              fund and would like an invite, get in touch and our team will follow
              up.
            </p>
            <a
              href="mailto:support@thiqwave.com?subject=Thiqwave%20Treasury%20access%20request"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Mail className="size-4" />
              Email support@thiqwave.com
            </a>
          </Card.Content>
          <Card.Footer className="justify-center">
            <p className="text-sm text-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brand hover:underline">
                Sign in
              </Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}
