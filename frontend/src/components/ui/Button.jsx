import { Loader2 } from 'lucide-react';

const VARIANT_CLASSES = {
  primary:
    'border-0 bg-[#c7c54d] text-[#3d2a3b] hover:bg-[#b4b23d] focus:ring-[#c7c54d]/40 shadow-[0_8px_20px_rgba(199,197,77,0.28)] font-bold',
  plum:
    'border-0 bg-[#51394e] text-white hover:bg-[#3d2a3b] focus:ring-[#51394e]/25 shadow-sm font-semibold',
  secondary:
    'border-0 bg-[#f0e8f0] text-[#5a3e57] hover:bg-[#e5def4] focus:ring-[#a45d81]/20 font-semibold',
  outline:
    'border border-[#d9cdca] bg-white text-[#5a3e57] hover:bg-[#fffaf7] hover:border-[#a45d81] focus:ring-[#a45d81]/15 font-semibold',
  oliveOutline:
    'border border-[#aaa33e] bg-transparent text-[#817c31] hover:bg-[#c7c54d]/15 focus:ring-[#c7c54d]/25 font-semibold',
  danger:
    'border-0 bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-700/30 shadow-sm font-semibold',
  ghost:
    'border-0 text-[#5a3e57] hover:bg-[#f0e8f0]/70 focus:ring-[#a45d81]/15 font-medium',
};

const SIZE_CLASSES = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-[13px]',
  lg: 'px-6 py-3 text-sm',
};

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  pill = true,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
        pill ? 'rounded-full' : 'rounded-xl'
      } ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary} ${
        SIZE_CLASSES[size] || SIZE_CLASSES.md
      } ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
