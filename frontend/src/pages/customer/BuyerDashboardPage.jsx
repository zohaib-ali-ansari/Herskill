import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Heart,
  Lock,
  MailCheck,
  Package,
  Phone,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Store,
  User,
  UserCheck,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessage } from '../../services/api';

export default function BuyerDashboardPage() {
  const { user, seller, switchMode, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  const isSeller = user?.roles?.includes('seller');
  const sellerStatus = seller?.verificationStatus || 'NOT_SUBMITTED';

  const [switching, setSwitching] = useState(false);

  // Account settings: profile edit
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Account settings: password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleSwitchToSeller = async () => {
    if (!isSeller) {
      navigate('/seller/activate');
      return;
    }
    setSwitching(true);
    try {
      await switchMode('seller');
      navigate('/seller/dashboard');
    } finally {
      setSwitching(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (profileForm.name.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[+\d][\d\s-]{8,18}$/.test(profileForm.phone.trim())) {
      setProfileError('Please enter a valid phone number.');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });
      setProfileSuccess(res.message || 'Profile updated successfully.');
    } catch (err) {
      setProfileError(extractErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(passwordForm);
      setPasswordSuccess(res.message || 'Password updated successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err) {
      setPasswordError(extractErrorMessage(err, 'Could not change password.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name || 'Member'}`}
      subtitle="Your Her Skill Buyer account, settings, and upcoming shopping tools."
      actions={
        <Button onClick={handleSwitchToSeller} loading={switching}>
          <Store className="h-4 w-4" />
          {isSeller ? 'Switch to Seller Mode' : 'Switch / Activate Seller Mode'}
        </Button>
      }
    >
      <div className="space-y-6">
        {!user?.isContactVerified && (
          <Alert type="warning" title="Contact verification pending">
            Verify your email or phone number to complete full buyer verification.{' '}
            <Link to="/verify-account" className="font-semibold underline">
              Verify now
            </Link>
          </Alert>
        )}

        {/* Top Summary Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8e5ed] text-[#a45d81]">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium text-[#8b7c83]">Active Mode</p>
                <p className="font-display text-lg font-bold text-[#5a3e57]">
                  Buyer Account
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#786b75]">
              Discover verified women entrepreneurs and handmade services from one
              unified Her Skill account.
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e5def4] text-[#5a3e57]">
                {user?.isContactVerified ? (
                  <MailCheck className="h-5 w-5" />
                ) : (
                  <ShieldAlert className="h-5 w-5" />
                )}
              </span>
              <div>
                <p className="text-xs font-medium text-[#8b7c83]">Contact Status</p>
                <p className="font-display text-lg font-bold text-[#5a3e57]">
                  {user?.isContactVerified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-[#786b75]">
              <UserCheck className="h-4 w-4 text-[#a45d81]" />
              <span className="truncate">{user?.email}</span>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4e9cb] text-[#817c31]">
                  <Store className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium text-[#8b7c83]">Seller Mode</p>
                  <p className="font-display text-lg font-bold text-[#5a3e57]">
                    {isSeller ? 'Enabled' : 'Not Activated'}
                  </p>
                </div>
              </div>
              {isSeller && <StatusBadge status={sellerStatus} />}
            </div>

            <div className="mt-4">
              <Button
                variant={isSeller ? 'plum' : 'primary'}
                size="sm"
                className="w-full"
                onClick={handleSwitchToSeller}
                loading={switching}
              >
                {isSeller ? 'Switch to Seller Account' : 'Become a Seller'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Profile Information */}
        <Card>
          <h2 className="font-display text-lg font-bold text-[#5a3e57]">
            Profile Information
          </h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-[#8b7c83]">Full Name</dt>
              <dd className="mt-0.5 font-semibold text-[#49384b]">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#8b7c83]">Email Address</dt>
              <dd className="mt-0.5 font-semibold text-[#49384b]">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#8b7c83]">Phone Number</dt>
              <dd className="mt-0.5 font-semibold text-[#49384b]">{user?.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#8b7c83]">Roles on Account</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {user?.roles?.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 rounded-full bg-[#f0e8f0] px-2.5 py-0.5 text-xs font-semibold capitalize text-[#5a3e57]"
                  >
                    <CheckCircle2 className="h-3 w-3 text-[#a45d81]" />
                    {role}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Future Orders & Wishlist Placeholders */}
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="border-dashed bg-[#fffaf7]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e0eddb] text-[#51394e]">
                  <Package className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-[#5a3e57]">
                    My Orders
                  </h3>
                  <p className="text-xs text-[#786b75]">
                    Track handmade purchases and service bookings
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#f0e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#73546d]">
                Coming Soon
              </span>
            </div>
            <div className="mt-4 rounded-xl border border-[#eadfdb] bg-white p-4 text-center text-xs text-[#786b75]">
              No orders yet. Once marketplace listings launch, your active orders and
              delivery updates will appear here.
            </div>
          </Card>

          <Card className="border-dashed bg-[#fffaf7]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8e5ed] text-[#a45d81]">
                  <Heart className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-[#5a3e57]">
                    Saved Wishlist
                  </h3>
                  <p className="text-xs text-[#786b75]">
                    Save favorite crafts and skilled creators
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#f0e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#73546d]">
                Coming Soon
              </span>
            </div>
            <div className="mt-4 rounded-xl border border-[#eadfdb] bg-white p-4 text-center text-xs text-[#786b75]">
              Your wishlist is empty. Save your favorite handmade products and studios
              here in the upcoming marketplace release.
            </div>
          </Card>
        </div>

        {/* Account Settings */}
        <div id="settings" className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Settings className="h-5 w-5 text-[#a45d81]" />
              <h2 className="font-display text-lg font-bold text-[#5a3e57]">
                Account Settings
              </h2>
            </div>
            <p className="text-xs text-[#786b75]">
              Update your display name or contact phone number for your Her Skill
              account.
            </p>

            {profileError && <Alert type="error">{profileError}</Alert>}
            {profileSuccess && <Alert type="success">{profileSuccess}</Alert>}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                icon={User}
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                icon={Phone}
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, phone: e.target.value }))
                }
                required
              />
              <Button type="submit" loading={profileLoading} size="sm">
                Save Account Changes
              </Button>
            </form>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-[#a45d81]" />
              <h2 className="font-display text-lg font-bold text-[#5a3e57]">
                Security &amp; Password
              </h2>
            </div>
            <p className="text-xs text-[#786b75]">
              Keep your account protected with a strong password (minimum 8
              characters).
            </p>

            {passwordError && <Alert type="error">{passwordError}</Alert>}
            {passwordSuccess && <Alert type="success">{passwordSuccess}</Alert>}

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                icon={Lock}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
                required
              />
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                icon={Lock}
                placeholder="Minimum 8 characters"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                }
                required
              />
              <Input
                label="Confirm New Password"
                name="confirmNewPassword"
                type="password"
                icon={Lock}
                value={passwordForm.confirmNewPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    confirmNewPassword: e.target.value,
                  }))
                }
                required
              />
              <Button type="submit" variant="plum" loading={passwordLoading} size="sm">
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
