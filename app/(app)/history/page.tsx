import { PageHeader } from "@/components/page-header";
import { TransactionsTable } from "@/components/transactions/transactions-table";

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="History" />
      <TransactionsTable />
    </>
  );
}
