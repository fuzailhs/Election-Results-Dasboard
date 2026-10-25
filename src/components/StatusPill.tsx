interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const partial = status.toLocaleLowerCase() !== "final";
  return (
    <span className={`status-pill${partial ? " status-pill-partial" : ""}`}>
      <span className="status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
