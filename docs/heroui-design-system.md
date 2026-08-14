# Adapting HeroUI to the Thiqwave Design System

A handoff guide for working in this codebase's UI layer. Read this before
touching components or styles. It documents how HeroUI v3 is themed here, the
color/font/elevation tokens, the field variants, our custom wrapper components,
and the gotchas that will bite you if you don't know them.

> TL;DR: We do **CSS-first theming**. HeroUI v3 reads CSS variables; we override
> those variables (and a few component classes) in [`app/globals.css`](../app/globals.css).
> Components stay stock HeroUI; the brand comes from tokens, not per-component styling.

---

## 1. Stack

- **Next.js 15** (App Router) + **TypeScript**, React 19.
- **HeroUI v3** — `@heroui/react` + `@heroui/styles` (both `^3.1.0`). Built on
  React Aria. **Not** NextUI / HeroUI v2 — the APIs differ; ignore v2 docs/memory.
- **Tailwind CSS v4** (`tailwindcss@^4`, `@tailwindcss/postcss`).
- **TanStack Query** for all data (the only thing wrapped in a provider).
- Fonts via `next/font/google`.

### No HeroUI provider
HeroUI v3 does **not** need a provider (unlike v2). The only app-wide wrapper is
`QueryClientProvider` in [`app/providers.tsx`](../app/providers.tsx). Don't add a
`HeroUIProvider`.

---

## 2. How theming works (read this first)

`app/globals.css` is the single source of truth:

```css
@import "tailwindcss";
@import "@heroui/styles";

:root {
  /* 1. raw brand scales (--neutral-*, --accent-*, ...) */
  /* 2. HeroUI semantic token overrides (--background, --surface, --accent, ...) */
}

@theme inline {
  /* 3. Tailwind tokens that generate utilities (--color-brand, --font-display, ...) */
}

/* 4. a few targeted component-class overrides (.table-root, .select--primary, ...) */
```

Three mechanisms, in order of preference:

1. **Override a HeroUI CSS variable** in `:root` (e.g. `--surface`, `--accent`,
   `--field-background`). This re-themes every component that reads it. **Most
   changes belong here.**
2. **Add a Tailwind token** in `@theme inline` to expose a utility (e.g.
   `--color-brand` → `bg-brand`, `--font-display` → `font-display`).
3. **Override a HeroUI component class** (e.g. `.table-root`, `.select--primary`)
   as a last resort, when no token controls the thing you need. Keep these rules
   **unlayered** (top-level in globals.css) — unlayered CSS wins over HeroUI's
   `@layer` styles, so you don't need `!important`.

HeroUI v3 renders **semantic classes** (`.card`, `.card__content`,
`.input--secondary`, `.select__trigger`, `.table-root`, `.tabs__tab`,
`.checkbox__control`, …). Those classes mostly resolve to CSS vars — so prefer
overriding the var. Inspect the rendered DOM (or `node_modules/@heroui/styles/dist/`)
to find which var a class reads.

---

## 3. Color tokens

### 3a. Raw brand scales (`:root`)
Cool neutrals + a petrol racing-green accent. Use these directly only when no
semantic token fits (e.g. `bg-[var(--neutral-50)]`).

| Scale | 50 → 950 |
|---|---|
| `--neutral-*` | `#f7fbfc` `#f0f5f7` `#e1e9ed` `#cdd8dc` `#adb9be` `#8b989e` `#6b797e` `#4f5b60` `#343f44` `#1d262a` `#0c1417` |
| `--accent-*` (petrol green) | `#eefffa` `#defcf3` `#c2f5e6` `#9fe7d4` `#68ccb4` `#28ad93` `#008c73` `#006b56` `#004b3b` `#002f23` `#001a12` |
| `--success-*` | green scale (`#376541` @ 700) |
| `--warning-*` | amber scale (`#725211` @ 700) |
| `--error-*` | red scale (`#884039` @ 700) |
| `--info-*` | blue scale (`#2180aa` @ 600) |

**Brand accent:** `--brand: var(--accent-900)` (`#002f23`), hover → `--accent-800`.

### 3b. HeroUI semantic tokens (what components actually read)
These are the override knobs. Change these to re-theme globally.

| Token | Value | Used for |
|---|---|---|
| `--background` | neutral-100 | page background |
| `--background-secondary` | neutral-100 | secondary page bg |
| `--surface` | `#ffffff` | cards, popovers, sheets |
| `--surface-foreground` | neutral-900 | text on surfaces |
| `--surface-hover` | neutral-100 | surface hover |
| `--surface-secondary` | neutral-50 | tertiary surfaces |
| `--surface-shadow` | `0 1px 3px 0 rgba(24,24,27,.035)` | **the "golden" card shadow** (§5) |
| `--foreground` | neutral-900 | primary text |
| `--muted` | neutral-500 | secondary text |
| `--border` / `--separator` | neutral-200 | borders, dividers |
| `--accent` | brand | primary buttons, active states |
| `--accent-foreground` | `#fff` | text on accent |
| `--accent-hover` | accent-800 | accent hover |
| `--accent-soft` / `-foreground` | accent-100 / accent-800 | soft accent chips, selected rows |
| `--focus` | brand | focus rings |
| `--link` | accent-700 | links |
| `--default` | neutral-100 | neutral controls, **in-surface field fill** |
| `--default-hover` | neutral-200 | neutral hover, field hover |
| `--default-soft` / `-foreground` | neutral-200 / neutral-700 | neutral chips, icon circles |
| `--success` / `--warning` / `--danger` | `*-700` | semantic solid |
| `--*-soft` / `-foreground` | `*-100` / `*-800` | semantic soft chips/badges |
| `--field-background` | `#ffffff` | **primary** field fill |
| `--field-foreground` | neutral-900 | field text |
| `--field-border` | neutral-300 | field border |
| `--field-placeholder` | neutral-400 | placeholder text |

> `--danger` maps to the **error** scale (HeroUI calls it danger; our scale is
> named error).

### 3c. Tailwind color utilities we added (`@theme inline`)
- `--color-brand` → `bg-brand` `text-brand` `border-brand` `ring-brand`
- `--color-info` → `bg-info` `text-info`

Everything else uses HeroUI's built-in semantic utilities: `bg-surface`,
`bg-default`, `bg-default-soft`, `bg-accent-soft`, `bg-background-secondary`,
`text-foreground`, `text-muted`, `text-danger`, `border-border`, etc. For raw
scale values, use arbitrary values: `bg-[var(--neutral-50)]`,
`hover:bg-[var(--neutral-50)]`.

---

## 4. Fonts

Three families, set up in [`app/layout.tsx`](../app/layout.tsx) via `next/font`
and exposed as CSS vars on `<html>`, then mapped to Tailwind tokens in `@theme`.

| Use | Class | Family | CSS var |
|---|---|---|---|
| Body / UI (default) | `font-sans` (default) | **Inter** | `--font-inter` |
| **Display** — headers, balances, money amounts, FX rates, numeric values | **`font-display`** | **Funnel Display** (brand) | `--font-funnel-display` |
| **Identifiers** — wallet addresses, tx hashes, IBANs, BIC, account/routing numbers, API keys | `font-mono` | **JetBrains Mono** | `--font-jetbrains-mono` |

**Rule of thumb:**
- A **header** or a **number a human reads as a value** (money, balance, rate,
  amount) → `font-display`.
- A **technical string** (hex hash, address, IBAN, key, account #) → `font-mono`.
- Everything else (labels, descriptions, body) → default (Inter).

To add a font: import it in `layout.tsx`, add its `.variable` to the `<html>`
className, and add a `--font-*` token in `@theme inline`.

---

## 5. Elevation / shadows ("the golden shadow")

One subtle contact shadow is used for **all** elevated surfaces:

```css
--surface-shadow: 0 1px 3px 0 rgba(24, 24, 27, 0.035);
```

- **Cards & Alerts** read `--surface-shadow` automatically (HeroUI's `.card`
  uses it). Just use `<Card>` — no shadow class needed.
- **Tables** (`.table-root`) carry no shadow by default, so globals.css adds:
  `.table-root { box-shadow: var(--surface-shadow); }`
- **Primary (on-page) fields** get the same shadow + a neutral-50 hover, scoped
  so secondary fields and checkboxes/radios are untouched:
  ```css
  .select--primary, .input--primary {
    --field-shadow: var(--surface-shadow);
    --field-hover: var(--neutral-50);
  }
  ```

To restyle elevation app-wide, change `--surface-shadow` only. Don't add ad-hoc
`shadow-*` classes to cards.

**Table cell padding** is tightened globally so wide tables fit without internal
horizontal scroll:
```css
.table__column, .table__cell { padding-inline: calc(var(--spacing) * 3); } /* 12px */
```

---

## 6. Field variants — in-surface vs on-page (important)

HeroUI `Input` / `Select` / `TextField` take a `variant`:

| `variant` | Look | Use when the field is… |
|---|---|---|
| **`secondary`** (our default) | flat **neutral-100** fill, **no shadow**, no border; hover → neutral-200 | **inside a white card / surface** (forms, modals, login, the converter) |
| `primary` | **white** fill, golden shadow, neutral-300 border; hover → neutral-50 | **on the page background** (e.g. the History table filters) |

Our wrapper components (`SelectField`, `TextInputField`, `IconSelect`) **default
to `secondary`** because almost everything lives in a card. Pass `variant="primary"`
for controls that sit directly on the page background, or they'll disappear into it.

```tsx
<SelectField variant="primary" label="Status" ... />   // on-page filter
<SelectField label="Currency" ... />                    // in a card (secondary)
```

Raw `<input>`/`<select>` (not via wrappers) should match the in-surface look
manually: `bg-default` + no border + `focus-visible:ring-2 focus-visible:ring-brand/40`
(see [`maker-checker-controls.tsx`](../components/settings/maker-checker-controls.tsx),
[`users-card.tsx`](../components/settings/users-card.tsx)).

---

## 7. HeroUI v3 component API cheat-sheet

Compositional, React-Aria-based. Key shapes + our conventions:

**Card** — `Card` · `Card.Header` · `Card.Title` · `Card.Description` ·
`Card.Content` · `Card.Footer`.
- No `isPressable`/`onPress`. A **clickable card** = a `<button className="group block w-full text-left">`
  wrapping `<Card className="... group-hover:bg-...">` (see `ChooserCard`).
- **Padding comes from `.card`** (`calc(--spacing*4)` = 16px), *not* `Card.Content`.
  To change it, add a padding utility to `<Card className="p-12">`.
- `Card.Content` is `display:flex; flex-direction:column` by default. If you put
  `flex items-center justify-between` directly on it you'll get a centered column —
  add `flex-row`, or (better) wrap the row in an inner `<div>`.

**Button** — `variant`: `primary` | `outline` | `ghost` | `tertiary`;
`onPress` (not `onClick`); `fullWidth`; `isPending`; `isDisabled`; `size="sm"`;
`isIconOnly`.

**Modal** — `const state = useOverlayState()`:
```tsx
<Button onPress={state.open}>Open</Button>
<Modal state={state}>
  <Modal.Backdrop><Modal.Container size="lg"><Modal.Dialog>
    <Modal.Header><Modal.Heading>Title</Modal.Heading></Modal.Header>
    <Modal.Body>…</Modal.Body>
    <Modal.Footer>…</Modal.Footer>
  </Modal.Dialog></Modal.Container></Modal.Backdrop>
</Modal>
```

**Select** — `variant` + `value` + `onChange(key)`:
```tsx
<Select variant="secondary" value={v} onChange={k => k && set(String(k))}>
  <Label>…</Label>
  <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
  <Select.Popover><ListBox>
    <ListBox.Item id="x" textValue="X" isDisabled={false}>X<ListBox.ItemIndicator /></ListBox.Item>
  </ListBox></Select.Popover>
</Select>
```

**Table** — `<Table>` is a wrapper div (`.table-root`); `Table.Content` is the
actual `<table>`:
```tsx
<Table>
  <Table.ScrollContainer>
    <Table.Content aria-label="…" sortDescriptor={sd} onSortChange={setSd} onRowAction={onRow}>
      <Table.Header>
        <Table.Column id="date" isRowHeader allowsSorting>Date</Table.Column>
      </Table.Header>
      <Table.Body renderEmptyState={() => "Nothing"}>
        <Table.Row id={row.id}><Table.Cell>…</Table.Cell></Table.Row>
      </Table.Body>
    </Table.Content>
  </Table.ScrollContainer>
</Table>
```

**Tabs** — `variant` + `selectedKey` + `onSelectionChange`. Default ("primary")
only changes the **active tab's text color**. For a **segmented white-pill**
control, style it (see `BankRecipientForm` holder-type tabs):
```tsx
<Tabs selectedKey={v} onSelectionChange={k => set(String(k))}>
  <Tabs.List className="w-full gap-1 rounded-lg bg-default-soft p-1">
    <Tabs.Tab id="a" className="flex-1 rounded-md py-1.5 text-center text-sm font-medium text-muted
      aria-selected:bg-surface aria-selected:text-foreground aria-selected:shadow-sm">A</Tabs.Tab>
  </Tabs.List>
</Tabs>
```

**Switch** — `<Switch isSelected onChange><Switch.Control><Switch.Thumb /></Switch.Control></Switch>`.

**Checkbox** — `<Checkbox isSelected onChange><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content><Label>…</Label></Checkbox.Content></Checkbox>`.

**Chip** — `<Chip color="success|warning|danger|default" variant="soft" size="sm"><Chip.Label>…</Chip.Label></Chip>`.

---

## 8. Custom wrapper / brand components

Prefer these over raw HeroUI; they bake in the conventions above.

| Component | File | Notes |
|---|---|---|
| `SelectField` | `components/ui/select-field.tsx` | HeroUI Select wrapper. `variant` defaults `secondary`; pass `primary` for on-page. `{label, ariaLabel, value, onChange, options, variant}` |
| `IconSelect` | `components/ui/icon-select.tsx` | Select with an icon in trigger + each option (coin/chain/flag). `secondary` by default. |
| `TextInputField` | `components/ui/text-input-field.tsx` | HeroUI TextField+Input+error/description. `secondary` by default. `mono` prop → `font-mono` (for identifier fields like IBAN/BIC/address). |
| `RadioField` | `components/ui/radio-field.tsx` | HeroUI RadioGroup wrapper. (Note: for binary choices we now prefer `Tabs` or a single `Checkbox`.) |
| `ChooserCard` + `IconCircle` | `components/ui/chooser-card.tsx` | The button-wrapped Card "pick one" row used by Deposit + Add-recipient. Single source for that pattern's hover/shadow. |
| `RecipientCard` | `components/recipients/recipient-card.tsx` | Bank/wallet recipient row. Optional `onSelect`/`selected` makes it a clickable card. |
| `StatusTag` / `AssetStatusTag` | `components/status-tag.tsx` | Chip-based status pills: `live`→success, `preview`→warning(amber), `coming_soon`→default(gray). |
| `AssetIcon` / `ChainIcon` | `components/token-icon.tsx` | `/public/coins/<sym>.svg|webp`, `/public/chains/<id>.svg`; monogram fallback; fiat → flag. `object-contain`. |
| `CircleFlag` | `components/circle-flag.tsx` | Circular country flag from `/public/flags/<code>.svg` (us, ae, eu). |
| `PageHeader` | `components/page-header.tsx` | `font-display` h1 + optional description/tag/actions. Use for page titles. |

---

## 9. Layout conventions

- Main content is centered at **`max-w-3xl`** (comfortable reading width) in
  [`app/(app)/.../app-shell.tsx`](../components/app-shell.tsx). The **`/history`**
  route opts out (`max-w-none`) because it's a wide data table. Add new wide-table
  routes to that conditional.
- Radii: cards `rounded-xl`, controls `rounded-lg` (HeroUI `.card` itself uses
  `min(32px, radius-3xl)`).
- Sidebar nav row styling is centralized in
  [`components/nav-styles.ts`](../components/nav-styles.ts) (`navRowClass` /
  `navIconClass`): inactive → neutral-700 text / neutral-400 icon / **neutral-50
  hover**; active → neutral-100 bg / brand icon. Reuse the neutral-50 hover for
  card-like hover states to stay consistent.
- Custom animation utility: `animate-row-in` (new-row enter; respects
  `prefers-reduced-motion`).

---

## 10. Gotchas (these will waste your time if you don't know them)

1. **`@theme inline` makes the raw var empty at runtime.** `--font-display`,
   `--font-mono`, `--color-brand` etc. are *inlined into the utility*, so
   `getComputedStyle(...).getPropertyValue('--font-display')` is `""` and
   `style="font-family: var(--font-display)"` won't work. **Use the utility
   class** (`font-display`, `bg-brand`), never the raw var.
2. **Tailwind v4 is JIT on source text.** A utility only exists if it appears
   *literally* in a `.tsx`/`.css` file. Dynamically built class strings and
   runtime-injected classes won't generate CSS. Don't test a class by injecting
   it via JS — it won't have a rule.
3. **Keep custom CSS unlayered.** Rules at the top level of `globals.css` win
   over HeroUI's `@layer` styles. If an override "isn't applying," it's usually a
   layering/specificity issue — don't reach for `!important`, keep it unlayered.
4. **To restyle a HeroUI component globally,** override the **CSS var** it reads
   (preferred) or its **semantic class** (`.table-root`, `.select--primary`) in
   globals.css. Per-instance `className` is fine for one-offs but doesn't scale.
5. **Card padding ≠ Card.Content padding** (see §7). And **Card.Content is
   `flex-col`** by default.
6. **`onPress`, not `onClick`** on HeroUI Button/pressables.
7. **No HeroUI provider** in v3 (§1).
8. **Funnel Display is proportional**, not tabular. Right-align numeric table
   columns; if you need strict digit alignment add `tabular-nums` to that column
   (or keep it `font-mono`).

---

## 11. Quick recipes

**Clickable card** (Deposit/recipient chooser pattern):
```tsx
<button type="button" onClick={onSelect} className="group block w-full text-left">
  <Card className="bg-surface transition-colors group-hover:bg-[var(--neutral-50)]">
    <Card.Content className="flex flex-row items-center gap-3">…</Card.Content>
  </Card>
</button>
```

**Money value:** `<span className="font-display">{formatUsd(x)}</span>`
**Identifier:** `<span className="font-mono">{truncateAddress(hash)}</span>`

**In-card form field:** `<TextInputField label="…" value={v} onChange={set} />`
(secondary/in-surface by default).

**On-page filter:** `<SelectField variant="primary" label="…" … />`.

**Page title:** `<PageHeader title="History" description="…" actions={…} />`.

**Settings row** (label left / control right) — wrap the row, don't style
`Card.Content` directly:
```tsx
<Card><Card.Content>
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="min-w-0">…label…</div>
    <Switch …/>
  </div>
</Card.Content></Card>
```
