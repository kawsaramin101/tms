interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  formatValue: (value: number) => string;
  emptyMessage?: string;
}

export function BarChart({
  data,
  formatValue,
  emptyMessage = "No data available for the selected period.",
}: BarChartProps) {
  const max = Math.max(...data.map((item) => item.value), 0);
  if (max <= 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={data
        .map((item) => `${item.label}: ${formatValue(item.value)}`)
        .join(", ")}
      className="flex h-40 items-end gap-6 rounded-md border border-border bg-background px-6 py-4"
    >
      {data.map((item) => {
        const height = Math.max(
          Math.round((item.value / max) * 100),
          item.value > 0 ? 4 : 0,
        );
        return (
          <div
            key={item.label}
            className="flex flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-xs font-medium text-foreground">
              {formatValue(item.value)}
            </span>
            <div
              className={
                item.value > 0
                  ? "w-full max-w-24 rounded-sm bg-primary"
                  : "w-full max-w-24 rounded-sm bg-muted"
              }
              style={{ height: `${Math.max(height, 2)}%` }}
            />
            <span className="text-xs text-muted-foreground">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
