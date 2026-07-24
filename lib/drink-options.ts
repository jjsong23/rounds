// Deliberately has no dependency on the generated Prisma client — this file
// is imported from client components, and the generated client pulls in
// Node-only code that can't be bundled for the browser. Kind strings match
// the Prisma DrinkPreferenceKind enum values exactly; callers on the server
// cast to that enum when writing to the database.
export const DRINK_KINDS = ["BEER_STYLE", "WINE_STYLE", "NON_ALC"] as const;
export type DrinkKind = (typeof DRINK_KINDS)[number];

// Not admin-managed like tags — a fixed, curated vocabulary for onboarding
// and profile editing. Non-alcoholic options are ordinary choices here, not
// a separate flow, per CLAUDE.md.
export const BEER_STYLES = [
  { value: "ipa", label: "IPA" },
  { value: "sour", label: "Sour" },
  { value: "pilsner", label: "Pilsner" },
  { value: "stout", label: "Stout" },
  { value: "lager", label: "Lager" },
  { value: "wheat", label: "Wheat" },
  { value: "porter", label: "Porter" },
] as const;

export const WINE_STYLES = [
  { value: "orange", label: "Orange" },
  { value: "sparkling", label: "Sparkling" },
  { value: "red-blend", label: "Red Blend" },
  { value: "rose", label: "Rosé" },
  { value: "white", label: "White" },
  { value: "dessert", label: "Dessert" },
] as const;

export const NON_ALC_OPTIONS = [
  { value: "na_beer", label: "N/A Beer" },
  { value: "na_wine", label: "N/A Wine" },
  { value: "kombucha", label: "Kombucha" },
  { value: "mocktail", label: "Mocktail" },
] as const;

export const DRINK_OPTION_GROUPS: {
  kind: DrinkKind;
  label: string;
  options: readonly { value: string; label: string }[];
}[] = [
  { kind: "BEER_STYLE", label: "Beer styles", options: BEER_STYLES },
  { kind: "WINE_STYLE", label: "Wine styles", options: WINE_STYLES },
  { kind: "NON_ALC", label: "Non-alcoholic", options: NON_ALC_OPTIONS },
];

export function isValidDrinkValue(kind: DrinkKind, value: string): boolean {
  const group = DRINK_OPTION_GROUPS.find((g) => g.kind === kind);
  if (!group) return false;
  return group.options.some((o) => o.value === value);
}
