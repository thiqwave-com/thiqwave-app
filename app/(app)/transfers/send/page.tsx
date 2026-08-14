import { PageHeader } from "@/components/page-header";
import { SendFlow } from "@/components/send/send-flow";

export default async function SendPage({
  searchParams,
}: {
  searchParams: Promise<{
    fromAsset?: string;
    fromChain?: string;
    amount?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Send" />
      <SendFlow
        initial={{ asset: sp.fromAsset, chain: sp.fromChain, amount: sp.amount }}
      />
    </>
  );
}
