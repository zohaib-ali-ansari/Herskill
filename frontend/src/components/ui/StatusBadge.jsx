import { BadgeCheck, Clock, FileEdit, XCircle } from 'lucide-react';

const STATUS_MAP = {
  NOT_SUBMITTED: {
    label: 'Not Submitted',
    classes: 'border-[#eadfdb] bg-[#f8f3f7] text-[#695d6a]',
    Icon: FileEdit,
  },
  PENDING: {
    label: 'Pending Review',
    classes: 'border-[#ddd39a] bg-[#f4e9cb]/70 text-[#817c31]',
    Icon: Clock,
  },
  APPROVED: {
    label: 'Verified Seller',
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    Icon: BadgeCheck,
  },
  REJECTED: {
    label: 'Rejected',
    classes: 'border-rose-200 bg-[#f8e5ed] text-[#8c486b]',
    Icon: XCircle,
  },
};

export default function StatusBadge({ status = 'NOT_SUBMITTED', className = '' }) {
  const config = STATUS_MAP[status] || STATUS_MAP.NOT_SUBMITTED;
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.classes} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
