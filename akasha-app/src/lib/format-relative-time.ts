export function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const pastDate = new Date(isoDate);
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

  const timeUnits = [
    { limit: 60, divisor: 1, suffix: "s" },
    { limit: 3600, divisor: 60, suffix: "m" },
    { limit: 86400, divisor: 3600, suffix: "h" },
    { limit: 2592000, divisor: 86400, suffix: "d" },
    { limit: 31536000, divisor: 2592000, suffix: "mo" },
  ];

  for (const unit of timeUnits) {
    if (diffInSeconds < unit.limit) {
      return `${Math.floor(diffInSeconds / unit.divisor)}${unit.suffix} ago`;
    }
  }

  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}
