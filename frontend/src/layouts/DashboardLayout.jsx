import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  ClipboardCheck,
  Home,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import BrandLogo from '../components/common/BrandLogo';
import Navbar from '../components/common/Navbar';
import StatusBadge from '../components/ui/StatusBadge';

export default function DashboardLayout({ title, subtitle, actions, children }) {
  const { user, seller, logout, switchMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const isAdmin = user?.roles?.includes('admin');
  const isSeller = user?.roles?.includes('seller');
  const isBuyer = user?.roles?.includes('buyer');
  const sellerStatus = seller?.verificationStatus || 'NOT_SUBMITTED';

  const handleModeSwitch = async (mode) => {
    setSwitching(true);
    try {
      await switchMode(mode);
      navigate(mode === 'seller' ? '/seller/dashboard' : '/buyer/dashboard');
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(isAdmin && !isBuyer ? '/admin/login' : '/login');
  };

  const isActive = (path) => location.pathname === path;

  const sidebarItemClass = (active) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
      active
        ? 'bg-[#6b4b65] text-white shadow-sm'
        : 'text-[#d8cbd4] hover:bg-[#6b4b65]/60 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-[#faf6f3]">
      {/* Desktop Plum Sidebar matching Her Skill Netlify reference */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#51394e] px-5 py-7 text-white lg:flex">
        <div className="space-y-8">
          <Link to="/" className="block px-1">
            <BrandLogo dark />
          </Link>

          <div>
            <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[1.5px] text-[#b9aab5]">
              {isAdmin
                ? 'Admin Portal'
                : user?.activeMode === 'seller'
                  ? 'Creator Dashboard'
                  : 'Buyer Account'}
            </p>

            <nav className="space-y-1.5">
              {isAdmin ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={sidebarItemClass(isActive('/admin/dashboard'))}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Overview
                  </Link>
                  <Link
                    to="/admin/verifications"
                    className={sidebarItemClass(
                      location.pathname.startsWith('/admin/verifications')
                    )}
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Seller Verifications
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/buyer/dashboard"
                    className={sidebarItemClass(isActive('/buyer/dashboard'))}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Buyer Dashboard
                  </Link>

                  {isSeller ? (
                    <>
                      <Link
                        to="/seller/dashboard"
                        className={sidebarItemClass(isActive('/seller/dashboard'))}
                      >
                        <Store className="h-4 w-4" />
                        Seller Dashboard
                      </Link>
                      <Link
                        to="/seller/verification/status"
                        className={sidebarItemClass(
                          location.pathname.startsWith('/seller/verification')
                        )}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Verification Status
                      </Link>
                      {(sellerStatus === 'NOT_SUBMITTED' ||
                        sellerStatus === 'REJECTED') && (
                        <Link
                          to="/seller/verification/apply"
                          className={sidebarItemClass(
                            isActive('/seller/verification/apply')
                          )}
                        >
                          <BadgeCheck className="h-4 w-4" />
                          {sellerStatus === 'REJECTED'
                            ? 'Resubmit Verification'
                            : 'Verify Identity'}
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link
                      to="/seller/activate"
                      className={sidebarItemClass(isActive('/seller/activate'))}
                    >
                      <Store className="h-4 w-4" />
                      Become a Seller
                    </Link>
                  )}
                </>
              )}

              <Link to="/" className={sidebarItemClass(false)}>
                <Home className="h-4 w-4" />
                Marketplace Home
              </Link>
            </nav>
          </div>
        </div>

        {/* Sidebar footer controls */}
        <div className="space-y-4 border-t border-[#6b4b65] pt-5">
          {!isAdmin && isSeller && (
            <div className="rounded-xl bg-[#3d2a3b]/70 p-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#c8bbc3]">
                Seller Status
              </p>
              <StatusBadge status={sellerStatus} />
            </div>
          )}

          {!isAdmin && isBuyer && isSeller && (
            <div className="space-y-1.5">
              <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#b9aab5]">
                Switch Mode
              </p>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#3d2a3b] p-1">
                <button
                  type="button"
                  disabled={switching}
                  onClick={() => handleModeSwitch('buyer')}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                    user.activeMode === 'buyer'
                      ? 'bg-[#c7c54d] text-[#3d2a3b]'
                      : 'text-[#d8cbd4] hover:text-white'
                  }`}
                >
                  Buyer
                </button>
                <button
                  type="button"
                  disabled={switching}
                  onClick={() => handleModeSwitch('seller')}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                    user.activeMode === 'seller'
                      ? 'bg-[#c7c54d] text-[#3d2a3b]'
                      : 'text-[#d8cbd4] hover:text-white'
                  }`}
                >
                  Seller
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#d8cbd4] transition hover:bg-[#6b4b65] hover:text-white cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {(title || subtitle || actions) && (
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                {title && (
                  <h1 className="font-display text-2xl font-bold tracking-tight text-[#5a3e57] sm:text-3xl">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-[#786b75]">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
