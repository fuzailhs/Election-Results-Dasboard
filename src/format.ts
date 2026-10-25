const numberFormatter = new Intl.NumberFormat("en-CA");
const percentFormatter = new Intl.NumberFormat("en-CA", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

export function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long", day: "numeric" }).format(date);
}
