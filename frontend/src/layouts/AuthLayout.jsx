import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';

export default function AuthLayout({
  title,
  subtitle,
  children,
  wide = false,
  badge = 'Women-Only Marketplace',
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(120deg, #fffaf7 0%, #fff8f4 55%, #eee7f5 100%)',
      }}
    >
      <header className="sticky top-0 z-20 border-b border-[#eee1dc] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" aria-label="Her Skill Home">
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfdb] bg-[#fffaf7] px-3.5 py-1.5 text-xs font-semibold text-[#5a3e57]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#a45d81]" />
              {badge}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
        <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
          {(title || subtitle) && (
            <div className="mb-7 text-center">
              {title && (
                <h1 className="font-display text-3xl font-bold tracking-tight text-[#5a3e57] sm:text-4xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-sm leading-relaxed text-[#786b75]">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          <div className="rounded-[24px] border border-[#eadfdb] bg-white p-6 shadow-[0_18px_45px_rgba(80,50,85,0.06)] sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
