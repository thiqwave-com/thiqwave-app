"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { errorCopy } from "@/lib/api/error-copy";
import type { AssetSymbol, ChainId, FiatRail } from "@/lib/api";
import { addDecimals } from "@/lib/money";
import { getChain } from "@/lib/config/assets";
import { useRates } from "@/lib/rates/use-rates";
import { RouteBreakdown } from "@/components/route/route-breakdown";

// Mimic async settlement: the conversion stays "processing" for a beat before
// balances and the transfer status update.
const SETTLE_DELAY_MS = 3200;

function isPositive(s: string): boolean {
  const v = addDecimals([s || "0"], 6);
  return v !== "0.000000" && !v.startsWith("-");
}

function sym(a: AssetSymbol | FiatRail): string {
  return a === "USD_VIBAN" ? "USD" : a === "AED_VIBAN" ? "AED" : a;
}

// "failed" = nothing was created, retrying is safe. "unconfirmed" = the
// conversion WAS created and a later step threw, so retrying could double it.
type Phase = "review" | "processing" | "done" | "failed" | "unconfirmed";

// Keyed by Phase, so adding a phase without a heading is a type error rather
// than a modal silently titled "Convert" over a failure message. Wording matches
// send-flow.tsx: "not started" and "outcome unknown" are different facts, and
// docs/decisions.md has a section on why that distinction has to survive.
const HEADING: Record<Phase, string> = {
  review: "Convert",
  processing: "Converting…",
  done: "Conversion complete",
  failed: "Conversion not started",
  unconfirmed: "Conversion submitted — outcome unknown",
};

/** Primary converter action: convert between your OWN positions. Debits the
 *  source, credits the destination — no recipient, no payout leg. */
export function ConvertHoldButton({
  fromAsset,
  fromChain,
  toAsset,
  toChain,
  amount,
  disabled,
  onConverted,
}: {
  fromAsset: AssetSymbol | FiatRail;
  fromChain: ChainId | null;
  toAsset: AssetSymbol | FiatRail;
  toChain: ChainId | null;
  amount: string;
  disabled?: boolean;
  onConverted?: () => void;
}) {
  const state = useOverlayState();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("review");
  const [error, setError] = useState<string | null>(null);
  const ratesQ = useRates();

  const quoteQ = useQuery({
    queryKey: [
      "convertQuote",
      fromAsset,
      fromChain,
      toAsset,
      toChain,
      amount,
      ratesQ.data?.asOf,
      ratesQ.data?.source,
    ],
    enabled: state.isOpen && isPositive(amount),
    queryFn: () =>
      api.buildQuote(
        {
          source: { asset: fromAsset, chain: fromChain, amount },
          destination: { asset: toAsset, chain: toChain },
        },
        ratesQ.data?.rates,
      ),
  });

  const sameTarget = fromAsset === toAsset && fromChain === toChain;

  function fail(e: unknown, submitted = false) {
    // Original goes to the console; only mapped copy reaches the DOM.
    console.error("[convert] conversion failed", e);
    setError(errorCopy(e));
    setPhase(submitted ? "unconfirmed" : "failed");
    qc.invalidateQueries({ queryKey: ["positions"] });
    qc.invalidateQueries({ queryKey: ["totalBalanceUsd"] });
    qc.invalidateQueries({ queryKey: ["transfers"] });
  }

  async function confirm() {
    const quote = quoteQ.data;
    if (!quote) return;
    setPhase("processing");
    let transfer;
    try {
      // 1) create the transfer in "processing" — no balance change yet.
      transfer = await api.convertAndHold({ quote });
    } catch (e) {
      fail(e);
      return;
    }
    qc.invalidateQueries({ queryKey: ["transfers"] });
    onConverted?.(); // clear the form
    // 2) settle after a beat → balances + status update. The rejection here
    // used to vanish entirely: an un-awaited async setTimeout callback leaves
    // nothing for React to catch, so the modal span forever.
    setTimeout(() => {
      api
        .settleTransfer(transfer.id)
        .then(() => {
          qc.invalidateQueries({ queryKey: ["positions"] });
          qc.invalidateQueries({ queryKey: ["totalBalanceUsd"] });
          qc.invalidateQueries({ queryKey: ["transfers"] });
          setPhase("done");
        })
        .catch((e) => fail(e, true));
    }, SETTLE_DELAY_MS);
  }

  return (
    <>
      <Button
        variant="primary"
        fullWidth
        isDisabled={!isPositive(amount) || sameTarget || disabled}
        onPress={() => {
          setError(null);
          setPhase("review");
          state.open();
        }}
      >
        Convert
      </Button>

      <Modal state={state}>
        <Modal.Backdrop>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading className="text-xl">
                  {HEADING[phase]}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {phase === "done" ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="size-7" />
                    </span>
                    <p className="text-sm text-foreground">
                      Converted to your own {sym(toAsset)} balance
                      {toChain ? ` on ${getChain(toChain)?.name}` : ""}.
                    </p>
                    <p className="text-xs text-muted">
                      Your positions and total balance have updated.
                    </p>
                  </div>
                ) : phase === "failed" || phase === "unconfirmed" ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <span
                      className={
                        phase === "unconfirmed"
                          ? "flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning"
                          : "flex size-12 items-center justify-center rounded-full bg-danger/15 text-danger"
                      }
                    >
                      <AlertCircle className="size-7" />
                    </span>
                    <p className="text-sm text-foreground">
                      {phase === "unconfirmed"
                        ? "The conversion was created, but we could not confirm how it finished."
                        : "The conversion was not created."}
                    </p>
                    <p className="max-w-full text-xs text-muted">
                      {error ?? "Something went wrong."}
                    </p>
                    <p className="text-xs text-muted">
                      {phase === "unconfirmed"
                        ? "Check your history before retrying — converting again could move funds twice."
                        : "No balances changed. You can safely try again."}
                    </p>
                  </div>
                ) : phase === "processing" ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Loader2 className="size-7 animate-spin text-brand" />
                    <p className="text-sm text-foreground">
                      Converting {sym(fromAsset)} → {sym(toAsset)}…
                    </p>
                    <p className="text-xs text-muted">
                      Settling on-chain — this takes a few seconds.
                    </p>
                  </div>
                ) : quoteQ.isPending || !quoteQ.data ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-muted">
                    <Loader2 className="size-4 animate-spin" /> Building route…
                  </div>
                ) : (
                  <RouteBreakdown
                    quote={quoteQ.data}
                    destinationCaption="You receive"
                  />
                )}
              </Modal.Body>
              <Modal.Footer>
                <div className="flex w-full flex-col gap-2">
                  {phase === "done" || phase === "failed" || phase === "unconfirmed" ? (
                    <Button
                      variant="primary"
                      fullWidth
                      onPress={() => state.close()}
                    >
                      {phase === "done" ? "Done" : "Close"}
                    </Button>
                  ) : phase === "processing" ? (
                    <Button
                      variant="ghost"
                      fullWidth
                      onPress={() => state.close()}
                    >
                      Close
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        fullWidth
                        isDisabled={!quoteQ.data}
                        onPress={confirm}
                      >
                        Confirm conversion
                      </Button>
                      <Button
                        variant="ghost"
                        fullWidth
                        onPress={() => state.close()}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
