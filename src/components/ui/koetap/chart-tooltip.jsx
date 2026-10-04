// The hover tooltip for recharts charts, styled as a small Koetap card (works in light and dark).
// Recharts passes active / payload / label; we add how to format them.
export function ChartTooltip({ active, payload, label, formatLabel, formatValue, valueLabel = "Value" }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;

  return (
    <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-popover-foreground shadow-md">
      <p className="text-xs text-muted-foreground">{formatLabel ? formatLabel(label) : label}</p>
      <p className="mt-0.5 text-sm font-semibold">
        {formatValue ? formatValue(value) : value}
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">{valueLabel}</span>
      </p>
    </div>
  );
}
