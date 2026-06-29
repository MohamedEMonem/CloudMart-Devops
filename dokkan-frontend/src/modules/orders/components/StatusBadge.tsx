const statusColors: Record<string, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  confirmed: 'bg-success/15 text-success border-success/30',
  paid: 'bg-success/15 text-success border-success/30',
  shipped: 'bg-accent-500/15 text-accent-300 border-accent-500/30',
  delivered: 'bg-accent2-500/15 text-accent2-400 border-accent2-500/30',
  cancelled: 'bg-danger/15 text-danger border-danger/30',
};

export default function StatusBadge({ status }: { status: string }) {
  const classes = statusColors[status.toLowerCase()] || 'bg-neutral-700 text-neutral-300 border-neutral-600';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${classes}`}>
      {status}
    </span>
  );
}
