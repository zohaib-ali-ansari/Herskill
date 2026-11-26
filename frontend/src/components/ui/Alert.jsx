import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const STYLES = {
  info: {
    container: 'border-[#d8cbd4] bg-[#f8f3f7] text-[#51394e]',
    Icon: Info,
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    Icon: CheckCircle2,
  },
  warning: {
    container: 'border-[#ddd39a] bg-[#f4e9cb]/60 text-[#665e20]',
    Icon: AlertTriangle,
  },
  error: {
    container: 'border-rose-200 bg-[#f8e5ed] text-[#8c486b]',
    Icon: AlertCircle,
  },
};

export default function Alert({ type = 'info', title, children, className = '' }) {
  const { container, Icon } = STYLES[type] || STYLES.info;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${container} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
