import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import BrandLogo from './BrandLogo';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';

export default function Navbar() {
  const { user, seller, logout, switchMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [switching, setSwitching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.roles?.includes('admin');
  const isSeller = user?.roles?.includes('seller');
  const isBuyer = user?.roles?.includes('buyer');
  const sellerStatus = seller?.verificationStatus || 'NOT_SUBMITTED';

  const handleLogout = async () => {
    await logout();
    navigate(isAdmin && !isBuyer ? '/admin/login' : '/login');
  };

  const handleModeSwitch = async (mode) => {
    setSwitching(true);
    try {
      await switchMode(mode);
      if (mode === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/buyer/dashboard');
      }
    } finally {
      setSwitching(false);
      setMobileOpen(false);
    }
  };

  const navLinkClass = (path) =>
    `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
      location.pathname === path
        ? 'bg-[#6b4b65] text-white'
        : 'text-[#d8cbd4] hover:bg-[#6b4b65]/60 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-[#eee1dc] bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            to={isAdmin && !isBuyer ? '/admin/dashboard' : '/'}
            className="lg:hidden"
          >
            <BrandLogo />
          </Link>
          <div className="hidden items-center gap-2.5 lg:flex">
            <span className="text-xs font-bold uppercase tracking-[1.5px] text-[#968b38]">
              {isAdmin
                ? 'Administrator Portal'
                : user?.activeMode === 'seller'
                  ? 'Seller Workspace'
                  : 'Buyer Workspace'}
            </span>
            {!isAdmin && isSeller && (
              <Link to="/seller/verification/status">
                <StatusBadge status={sellerStatus} />
              </Link>
            )}
          </div>
        </div>

        {/* Desktop right controls */}
        <div className="hidden items-center gap-3 md:flex">
          {!isAdmin && isBuyer && isSeller && (
            <div className="flex items-center rounded-full border border-[#eadfdb] bg-[#faf6f3] p-1">
              <button
                type="button"
                disabled={switching}
                onClick={() => handleModeSwitch('buyer')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  user.activeMode === 'buyer'
                    ? 'bg-[#51394e] text-white shadow-sm'
                    : 'text-[#695d6a] hover:text-[#51394e]'
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Buyer Mode
              </button>
              <button
                type="button"
                disabled={switching}
                onClick={() => handleModeSwitch('seller')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  user.activeMode === 'seller'
                    ? 'bg-[#51394e] text-white shadow-sm'
                    : 'text-[#695d6a] hover:text-[#51394e]'
                }`}
              >
                <Store className="h-3.5 w-3.5" />
                Seller Mode
              </button>
            </div>
          )}

          {!isAdmin && isBuyer && !isSeller && (
            <Link to="/seller/activate">
              <Button variant="oliveOutline" size="sm">
                <Store className="h-3.5 w-3.5" />
                Switch / Become Seller
              </Button>
            </Link>
          )}

          {isAdmin && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8cbd4] bg-[#f8f3f7] px-3 py-1 text-xs font-semibold text-[#51394e]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#a45d81]" />
              Verified Admin
            </span>
          )}

          <div className="flex items-center gap-3 border-l border-[#eee1dc] pl-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-[#5a3e57]">{user?.name}</p>
              <p className="text-[11px] text-[#8b7c83]">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-xl p-2 text-[#51394e] hover:bg-[#faf6f3] md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="space-y-4 border-t border-[#6b4b65] bg-[#51394e] px-4 py-4 text-white md:hidden">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-[#d8cbd4]">{user?.email}</p>
            </div>
            {!isAdmin && isSeller && <StatusBadge status={sellerStatus} />}
          </div>

          <nav className="space-y-1">
            {isAdmin ? (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass('/admin/dashboard')}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard Overview
                </Link>
                <Link
                  to="/admin/verifications"
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass('/admin/verifications')}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Seller Verifications
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/buyer/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass('/buyer/dashboard')}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Buyer Account
                </Link>
                {isSeller && (
                  <>
                    <Link
                      to="/seller/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className={navLinkClass('/seller/dashboard')}
                    >
                      <Store className="h-4 w-4" />
                      Seller Account
                    </Link>
                    <Link
                      to="/seller/verification/status"
                      onClick={() => setMobileOpen(false)}
                      className={navLinkClass('/seller/verification/status')}
                    >
                      <BadgeCheck className="h-4 w-4" />
                      Verification Status
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {!isAdmin && (
            <div className="flex flex-wrap gap-2">
              {isBuyer && isSeller ? (
                <>
                  <Button
                    size="sm"
                    variant={user.activeMode === 'buyer' ? 'primary' : 'outline'}
                    onClick={() => handleModeSwitch('buyer')}
                    disabled={switching}
                  >
                    Buyer Mode
                  </Button>
                  <Button
                    size="sm"
                    variant={user.activeMode === 'seller' ? 'primary' : 'outline'}
                    onClick={() => handleModeSwitch('seller')}
                    disabled={switching}
                  >
                    Seller Mode
                  </Button>
                </>
              ) : (
                <Link
                  to="/seller/activate"
                  onClick={() => setMobileOpen(false)}
                  className="w-full"
                >
                  <Button size="sm" className="w-full">
                    <Store className="h-3.5 w-3.5" />
                    Activate Seller Mode
                  </Button>
                </Link>
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      )}
    </header>
  );
}
