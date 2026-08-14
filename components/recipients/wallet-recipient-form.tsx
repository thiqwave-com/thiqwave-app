"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Checkbox, Label } from "@heroui/react";
import { api } from "@/lib/api";
import type { AssetSymbol, ChainId, CreateWalletRecipientInput } from "@/lib/api";
import {
  CHAINS,
  COMING_SOON_CHAINS,
  assetsForChain,
  getChain,
  validateAddress,
} from "@/lib/config/assets";
import { SelectField } from "@/components/ui/select-field";
import { TextInputField } from "@/components/ui/text-input-field";

const CHAIN_OPTIONS = [
  ...CHAINS.map((c) => ({ id: c.id, label: c.name })),
  ...COMING_SOON_CHAINS.map((c) => ({
    id: c.id,
    label: `${c.name} (coming soon)`,
    disabled: true,
  })),
];

/**
 * Stablecoin-wallet recipient form. `onBack` returns to the type chooser;
 * `onSaved` fires after a successful create.
 */
export function WalletRecipientForm({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [isOwner, setIsOwner] = useState(false);
  const [chain, setChain] = useState<ChainId>("base");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [acceptedAssets, setAcceptedAssets] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: (input: CreateWalletRecipientInput) =>
      api.createWalletRecipient(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipients"] });
      onSaved();
    },
  });

  function pickChain(v: string) {
    setChain(v as ChainId);
    setAcceptedAssets([]); // available assets differ per chain
  }

  function toggleAsset(sym: string, selected: boolean) {
    setAcceptedAssets((prev) =>
      selected ? [...prev, sym] : prev.filter((s) => s !== sym),
    );
  }

  const available = assetsForChain(chain);
  const addressValid = validateAddress(chain, address);
  const addressInvalid = address.length > 0 && !addressValid;
  const canSave = Boolean(label && addressValid && acceptedAssets.length > 0);

  function save() {
    mutation.mutate({
      label,
      ownership: isOwner ? "own" : "third_party",
      chain,
      address: address.trim(),
      acceptedAssets: acceptedAssets as AssetSymbol[],
    });
  }

  return (
    <Card className="max-w-2xl bg-surface">
      <Card.Content className="space-y-4">
        <SelectField
          label="Chain"
          value={chain}
          onChange={pickChain}
          options={CHAIN_OPTIONS}
        />

        {/* Ownership — single checkbox. */}
        <Checkbox isSelected={isOwner} onChange={setIsOwner}>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Content>
            <Label>I am the owner of this wallet</Label>
          </Checkbox.Content>
        </Checkbox>

        <TextInputField
          label="Address"
          value={address}
          onChange={setAddress}
          placeholder={`Enter a ${getChain(chain)?.name ?? ""} address`}
          mono
          isInvalid={addressInvalid}
          error={`Enter a valid ${getChain(chain)?.name ?? "wallet"} address`}
          description="Validated against the chain's address format."
        />
        <TextInputField
          label="Label"
          value={label}
          onChange={setLabel}
          placeholder="e.g. OTC Desk — Tron"
          isRequired
        />

        <div>
          <Label>Accepted assets</Label>
          <p className="mt-0.5 mb-2 text-xs text-muted">
            Filtered to assets available on {getChain(chain)?.name}.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {available.map((a) => (
              <Checkbox
                key={a.symbol}
                isSelected={acceptedAssets.includes(a.symbol)}
                onChange={(sel) => toggleAsset(a.symbol, sel)}
              >
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <Label>{a.symbol}</Label>
                </Checkbox.Content>
              </Checkbox>
            ))}
          </div>
        </div>
      </Card.Content>
      <Card.Footer className="flex-col gap-2">
        <Button
          variant="primary"
          fullWidth
          isDisabled={!canSave}
          isPending={mutation.isPending}
          onPress={save}
        >
          Save recipient
        </Button>
        <Button variant="ghost" fullWidth onPress={onBack}>
          Back
        </Button>
      </Card.Footer>
    </Card>
  );
}
