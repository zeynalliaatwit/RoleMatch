import type { ApplicationStage, ApplicationStatus } from '../data/mockData';

const statusLabels: Record<ApplicationStatus, string> = {
  blocked: 'Blocked',
  offer: 'Offer',
  rejected: 'Rejected',
  submitted: 'Submitted',
};

interface StatusBadgeProps {
  status: ApplicationStatus;
  stage?: ApplicationStage;
}

export function StatusBadge({ status, stage }: StatusBadgeProps) {
  const label = status === 'submitted' && stage === 'Interview'
    ? 'Submitted / interview'
    : statusLabels[status];

  return <span className={`status-badge status-${status}${stage === 'Interview' ? ' stage-interview' : ''}`}>{label}</span>;
}
