export default function Input({
  label,
  id,
  error,
  helperText,
  icon: Icon,
  rightElement,
  className = '',
  as = 'input',
  rows = 4,
  ...props
}) {
  const inputId = id || props.name;
  const baseClass = `w-full rounded-xl border bg-[#fffdfc] py-2.5 text-sm text-[#49384b] placeholder:text-[#a18f97] transition-colors focus:outline-none focus:ring-4 ${
    Icon ? 'pl-10' : 'px-3.5'
  } ${rightElement ? 'pr-11' : 'pr-3.5'} ${
    error
      ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/15'
      : 'border-[#ddd2cf] focus:border-[#a45d81] focus:ring-[#a45d81]/15'
  } ${className}`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-[#5a3e57]"
        >
          {label}
          {props.required && <span className="ml-1 text-[#a45d81]">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#927d87]" />
        )}
        {as === 'textarea' ? (
          <textarea id={inputId} rows={rows} className={baseClass} {...props} />
        ) : (
          <input id={inputId} className={baseClass} {...props} />
        )}
        {rightElement && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs font-medium text-rose-700">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-[#786b75]">{helperText}</p>
      )}
    </div>
  );
}
