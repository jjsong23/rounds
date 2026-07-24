const NOISE_CONFIG = {
  QUIET: { label: "Quiet", dot: "bg-moss" },
  MODERATE: { label: "Moderate", dot: "bg-amber" },
  LOUD: { label: "Loud", dot: "bg-brick" },
} as const;

// Noise is the highest-value filter in the product — a loud taproom kills
// a table of strangers — so it gets a dedicated, always-present indicator
// rather than being just another word in an attribute list.
export function NoiseBadge({ level }: { level: keyof typeof NOISE_CONFIG }) {
  const config = NOISE_CONFIG[level];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}
