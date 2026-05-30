import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  to?: string;
}

export function StatCard({ label, value, detail, icon: Icon, to }: StatCardProps) {
  const content = (
    <>
      <div className="stat-icon" aria-hidden="true">
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </>
  );

  if (to) {
    return (
      <Link className="stat-card stat-card-link" to={to}>
        {content}
      </Link>
    );
  }

  return (
    <article className="stat-card">
      {content}
    </article>
  );
}
