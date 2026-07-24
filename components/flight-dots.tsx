// The product's signature motif: a round's capacity rendered as a flight of
// glasses — filled for each confirmed seat, outline for each seat still
// open. Reused everywhere capacity shows up (cards, round detail, feed) so
// it reads as one consistent idea rather than a generic progress bar.
export function FlightDots({
  filled,
  total,
  className = "",
}: {
  filled: number;
  total: number;
  className?: string;
}) {
  const capped = Math.min(total, 12);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-hidden="true">
      {Array.from({ length: capped }, (_, i) => (
        <span
          key={i}
          className={
            i < filled
              ? "h-2.5 w-2.5 rounded-full bg-amber"
              : "h-2.5 w-2.5 rounded-full border border-current opacity-40"
          }
        />
      ))}
    </span>
  );
}
