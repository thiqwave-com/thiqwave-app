"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { errorCopy } from "@/lib/api/error-copy";

/** Restores the seeded store and refreshes every query. */
export function ResetDemo() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      await api.resetDemo();
      await qc.invalidateQueries();
    } catch (e) {
      // Without the finally, a rejection here left the button permanently
      // disabled with a spinning icon and no message. resetDemo throws by
      // construction in live mode.
      console.error("[reset-demo] reset failed", e);
      setError(errorCopy(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={reset}
        disabled={busy}
        className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-50"
      >
        <RotateCcw className={busy ? "size-3.5 animate-spin" : "size-3.5"} />
        Reset demo
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
