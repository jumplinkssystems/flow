import { STATUS_LABELS, statusThemeStyle } from '../store';

export default function StatusBadge({ status }) {
  if (!status) return null;
  const label = STATUS_LABELS[status] || status;
  return (
    <span className="flow-ew-badge" style={statusThemeStyle(status)}>
      <span className="flow-ew-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
