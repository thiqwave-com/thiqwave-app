import { notFound } from "next/navigation";
import type { FiatRail } from "@/lib/api";
import { AccountDetail } from "@/components/accounts/account-detail";

const RAIL_MAP: Record<string, FiatRail> = {
  usd: "USD_VIBAN",
  aed: "AED_VIBAN",
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ rail: string }>;
}) {
  const { rail } = await params;
  const fiatRail = RAIL_MAP[rail];
  if (!fiatRail) notFound();
  return <AccountDetail rail={fiatRail} />;
}
