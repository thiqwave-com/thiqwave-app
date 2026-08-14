"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Checkbox, Label, Tabs } from "@heroui/react";
import { api } from "@/lib/api";
import type { CreateBankRecipientInput } from "@/lib/api";
import { IconSelect } from "@/components/ui/icon-select";
import { TextInputField } from "@/components/ui/text-input-field";
import { CircleFlag } from "@/components/circle-flag";

type Currency = "USD" | "AED" | "EUR";

type BankForm = {
  label: string;
  currency: Currency;
  holderType: "business" | "individual";
  isOwner: boolean;
  accountName: string;
  iban: string;
  accountNumber: string;
  routingNumber: string;
  bic: string;
  bankName: string;
  country: string;
};

const INITIAL: BankForm = {
  label: "",
  currency: "USD",
  holderType: "business",
  isOwner: false,
  accountName: "",
  iban: "",
  accountNumber: "",
  routingNumber: "",
  bic: "",
  bankName: "",
  country: "",
};

const CURRENCY = [
  { id: "USD", label: "USD — US Dollar", icon: <CircleFlag code="us" size={20} /> },
  { id: "AED", label: "AED — UAE Dirham", icon: <CircleFlag code="ae" size={20} /> },
  { id: "EUR", label: "EUR — Euro", icon: <CircleFlag code="eu" size={20} /> },
];

/**
 * Bank-recipient form. Currency is the first field and drives the rest: EUR/AED
 * accounts are identified by IBAN; USD accounts use an account + ABA routing
 * number (the US has no IBAN). `onBack` returns to the type chooser; `onSaved`
 * fires after a successful create.
 */
export function BankRecipientForm({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<BankForm>(INITIAL);
  const set = (k: keyof BankForm) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const usesIban = form.currency === "EUR" || form.currency === "AED";

  function pickCurrency(v: string) {
    // Reset the identifier fields that don't apply to the chosen currency.
    setForm((f) => ({
      ...f,
      currency: v as Currency,
      iban: "",
      accountNumber: "",
      routingNumber: "",
    }));
  }

  const mutation = useMutation({
    mutationFn: (input: CreateBankRecipientInput) =>
      api.createBankRecipient(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipients"] });
      onSaved();
    },
  });

  const identifierValid = usesIban
    ? Boolean(form.iban)
    : Boolean(form.accountNumber && form.routingNumber);

  const canSave = Boolean(
    form.label &&
      form.accountName &&
      form.bankName &&
      form.country &&
      form.currency &&
      identifierValid,
  );

  function save() {
    mutation.mutate({
      label: form.label,
      ownership: form.isOwner ? "own" : "third_party",
      holderType: form.holderType,
      currency: form.currency,
      accountName: form.accountName,
      iban: usesIban ? form.iban : undefined,
      accountNumber: usesIban ? undefined : form.accountNumber,
      routingNumber: usesIban ? undefined : form.routingNumber || undefined,
      bic: form.bic || undefined,
      bankName: form.bankName,
      country: form.country,
    });
  }

  return (
    <Card className="max-w-2xl bg-surface">
      <Card.Content className="grid gap-4 sm:grid-cols-2">
        {/* Currency — first; everything below depends on it. */}
        <div className="sm:col-span-2">
          <Label>Currency</Label>
          <IconSelect
            className="mt-1.5"
            ariaLabel="Currency"
            value={form.currency}
            onChange={pickCurrency}
            options={CURRENCY}
          />
        </div>

        {/* Holder type — tabs, kept high on the form. */}
        <div className="sm:col-span-2">
          <Label>Holder type</Label>
          <Tabs
            aria-label="Holder type"
            className="mt-1.5"
            selectedKey={form.holderType}
            onSelectionChange={(key) =>
              setForm((f) => ({
                ...f,
                holderType: String(key) as BankForm["holderType"],
              }))
            }
          >
            <Tabs.List className="w-full gap-1 rounded-lg bg-default-soft p-1">
              <Tabs.Tab
                id="business"
                className="flex-1 cursor-pointer rounded-md py-1.5 text-center text-sm font-medium text-muted outline-none transition-colors aria-selected:bg-surface aria-selected:text-foreground aria-selected:shadow-sm"
              >
                Business
              </Tabs.Tab>
              <Tabs.Tab
                id="individual"
                className="flex-1 cursor-pointer rounded-md py-1.5 text-center text-sm font-medium text-muted outline-none transition-colors aria-selected:bg-surface aria-selected:text-foreground aria-selected:shadow-sm"
              >
                Individual
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </div>

        {/* Ownership — single checkbox. */}
        <div className="sm:col-span-2">
          <Checkbox
            isSelected={form.isOwner}
            onChange={(sel) => setForm((f) => ({ ...f, isOwner: sel }))}
          >
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              <Label>I am the owner of this account</Label>
            </Checkbox.Content>
          </Checkbox>
        </div>

        <TextInputField
          className="sm:col-span-2"
          label="Label"
          value={form.label}
          onChange={set("label")}
          placeholder="e.g. Helios Capital — Northwind USD"
          isRequired
        />
        <TextInputField
          className="sm:col-span-2"
          label="Account name"
          value={form.accountName}
          onChange={set("accountName")}
          placeholder="Legal account holder name"
          isRequired
        />
        <TextInputField
          label="Bank name"
          value={form.bankName}
          onChange={set("bankName")}
          placeholder="e.g. Northwind Bank N.A."
          isRequired
        />
        <TextInputField
          label="Country"
          value={form.country}
          onChange={set("country")}
          placeholder={usesIban ? "e.g. United Arab Emirates" : "e.g. United States"}
          isRequired
        />

        {usesIban ? (
          <>
            <TextInputField
              className="sm:col-span-2"
              label="IBAN"
              value={form.iban}
              onChange={set("iban")}
              placeholder={`${form.currency} accounts are identified by IBAN`}
              mono
              isRequired
            />
            <TextInputField
              className="sm:col-span-2"
              label="BIC / SWIFT"
              value={form.bic}
              onChange={set("bic")}
              placeholder="e.g. DEMOAEAD"
              mono
            />
          </>
        ) : (
          <>
            <TextInputField
              label="Routing number (ABA)"
              value={form.routingNumber}
              onChange={set("routingNumber")}
              placeholder="9 digits"
              inputMode="numeric"
              mono
              isRequired
            />
            <TextInputField
              label="Account number"
              value={form.accountNumber}
              onChange={set("accountNumber")}
              placeholder="US accounts use account + routing"
              inputMode="numeric"
              mono
              isRequired
            />
            <TextInputField
              className="sm:col-span-2"
              label="BIC / SWIFT"
              value={form.bic}
              onChange={set("bic")}
              placeholder="For international wires (optional)"
              mono
            />
          </>
        )}
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
