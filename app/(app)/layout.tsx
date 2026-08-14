import { AppGate } from "@/components/auth/app-gate";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppGate>{children}</AppGate>;
}
