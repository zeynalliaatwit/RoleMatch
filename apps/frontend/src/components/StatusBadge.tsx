import type { ApplicationStatus } from '../data/mockData';

const statusLabels: Record<ApplicationStatus, string> = {
  blocked: 'Blocked',
  draft: 'Draft',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  saved: 'Saved',
  submitted: 'Submitted',
};

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status}`}>{statusLabels[status]}</span>;
}
