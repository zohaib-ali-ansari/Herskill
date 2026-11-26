export default function BrandLogo({ dark = false, showSubtitle = false }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c8c84e] text-lg font-bold text-white shadow-sm"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        H
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[20px] font-bold tracking-tight">
          <span className={dark ? 'text-white' : 'text-[#5a3e57]'}>Her</span>
          <span className={dark ? 'text-[#d2cd60]' : 'text-[#a5a33c]'}> Skill</span>
        </span>
        {showSubtitle && (
          <span
            className={`mt-1 text-[10px] font-semibold uppercase tracking-[1.2px] ${
              dark ? 'text-[#c8bbc3]' : 'text-[#8b7c83]'
            }`}
          >
            Women-Only Marketplace
          </span>
        )}
      </span>
    </span>
  );
}
