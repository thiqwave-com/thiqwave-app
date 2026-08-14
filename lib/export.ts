// Client-side file export for transaction history. Generates and
// downloads a real CSV / PDF from the visible rows. jspdf is dynamically imported
// so it stays out of the main bundle until the user actually exports.

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: string[][],
): void {
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((r) => r.map(esc).join(","))
    .join("\r\n");
  triggerDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    filename,
  );
}

export async function downloadPdf(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: string[][],
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

  doc.setFontSize(16);
  doc.text(title, 40, 42);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(subtitle, 40, 60);

  autoTable(doc, {
    startY: 76,
    head: [headers],
    body: rows,
    styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    alternateRowStyles: { fillColor: [247, 247, 248] },
    margin: { left: 40, right: 40 },
  });

  doc.save(filename);
}
