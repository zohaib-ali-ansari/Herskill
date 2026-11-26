import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Edit3,
  Lock,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Store,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { checkSellerPublishPermission } from '../../services/sellerService';
import { extractErrorMessage } from '../../services/api';

const CATEGORIES = [
  'Handmade Crafts & Art',
  'Tailoring & Boutique Fashion',
  'Home Baking & Catering',
  'Beauty, Henna & Makeup',
  'Jewelry & Accessories',
  'Graphic Design & Digital Services',
  'Tutoring & Coaching',
  'Embroidery & Textile Work',
];

export default function SellerDashboardPage() {
  const { user, seller, switchMode, saveSellerProfile } = useAuth();
  const navigate = useNavigate();

  const status = seller?.verificationStatus || 'NOT_SUBMITTED';
  const isApproved = status === 'APPROVED';

  const [switching, setSwitching] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    businessName: seller?.profile?.businessName || '',
    businessDescription: seller?.profile?.businessDescription || '',
    categories: seller?.profile?.categories || [],
    city: seller?.profile?.city || '',
    residentialAddress: seller?.profile?.residentialAddress || '',
    phone: seller?.profile?.phone || user?.phone || '',
    socialLink: seller?.profile?.socialLink || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const handleSwitchToBuyer = async () => {
    setSwitching(true);
    try {
      await switchMode('buyer');
      navigate('/buyer/dashboard');
    } finally {
      setSwitching(false);
    }
  };

  const handlePublishCheck = async () => {
    setChecking(true);
    setPublishResult(null);
    try {
      const data = await checkSellerPublishPermission();
      setPublishResult({ type: 'success', message: data.message });
    } catch (err) {
      setPublishResult({
        type: 'error',
        message: extractErrorMessage(
          err,
          'Only verified sellers with APPROVED status can publish products or services.'
        ),
      });
    } finally {
      setChecking(false);
    }
  };

  const toggleCategory = (cat) => {
    setProfileForm((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (profileForm.businessName.trim().length < 2) {
      setProfileError('Store or business name is required.');
      return;
    }
    if (profileForm.businessDescription.trim().length < 20) {
      setProfileError('Business description must be at least 20 characters.');
      return;
    }
    if (profileForm.categories.length === 0) {
      setProfileError('Select at least one product or service category.');
      return;
    }
    if (profileForm.city.trim().length < 2) {
      setProfileError('City is required.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await saveSellerProfile({
        businessName: profileForm.businessName.trim(),
        businessDescription: profileForm.businessDescription.trim(),
        categories: profileForm.categories,
        city: profileForm.city.trim(),
        residentialAddress: profileForm.residentialAddress.trim() || undefined,
        phone: profileForm.phone.trim(),
        socialLink: profileForm.socialLink.trim(),
      });
      setProfileSuccess(res.message || 'Seller profile updated successfully.');
      setEditing(false);
    } catch (err) {
      setProfileError(extractErrorMessage(err, 'Unable to update seller profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name || 'Creator'}`}
      subtitle={
        seller?.profile?.businessName
          ? `${seller.profile.businessName} • Seller Account`
          : 'Manage your Her Skill seller profile, verification status, and studio.'
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchToBuyer}
            loading={switching}
          >
            <ShoppingBag className="h-4 w-4" />
            Switch to Buyer Mode
          </Button>
          <Button
            variant="plum"
            size="sm"
            onClick={() => {
              setEditing((prev) => !prev);
              setProfileError('');
              setProfileSuccess('');
            }}
          >
            <Edit3 className="h-4 w-4" />
            {editing ? 'Close Profile Editor' : 'Edit Seller Profile'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Verification Status Banner */}
        {status === 'NOT_SUBMITTED' && (
          <Alert type="warning" title="Seller Verification Required">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <span>
                You have not submitted your verification application yet. Complete
                identity &amp; business verification to unlock product publishing.
              </span>
              <Link to="/seller/verification/apply" className="shrink-0">
                <Button size="sm">Start Verification</Button>
              </Link>
            </div>
          </Alert>
        )}

        {status === 'PENDING' && (
          <Alert type="info" title="Verification Application Pending Review">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <span>
                Your documents are under administrator review. You can edit your
                profile or switch to Buyer mode, but publishing remains locked until
                approved.
              </span>
              <Link to="/seller/verification/pending" className="shrink-0">
                <Button variant="outline" size="sm">
                  View Submission
                </Button>
              </Link>
            </div>
          </Alert>
        )}

        {status === 'REJECTED' && (
          <Alert type="error" title="Seller Verification Rejected">
            <div className="space-y-3">
              <p>
                <strong>Reason:</strong>{' '}
                {seller?.rejectionReason ||
                  'Please review your submitted details and documents.'}
              </p>
              <Link to="/seller/verification/apply">
                <Button size="sm">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Fix &amp; Resubmit Application
                </Button>
              </Link>
            </div>
          </Alert>
        )}

        {/* Seller Profile Header Card */}
        <Card className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-[#f4e9cb] text-[#817c31]'
              }`}
            >
              {isApproved ? (
                <BadgeCheck className="h-7 w-7" />
              ) : (
                <Store className="h-7 w-7" />
              )}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-xl font-bold text-[#5a3e57]">
                  {seller?.profile?.businessName || `${user?.name}'s Studio`}
                </h2>
                <StatusBadge status={status} />
              </div>
              <p className="mt-1 text-xs text-[#786b75]">
                {isApproved
                  ? 'Verified Woman Entrepreneur • Approved to publish products & services'
                  : 'Basic Seller Account • Publishing unlocks after Admin approval'}
                {seller?.profile?.city ? ` • ${seller.profile.city}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {seller?.profile?.verifiedAt && isApproved && (
              <span className="text-xs text-[#786b75]">
                Verified on{' '}
                {new Date(seller.profile.verifiedAt).toLocaleDateString()}
              </span>
            )}
            <Link to="/seller/verification/status">
              <Button variant="outline" size="sm">
                Verification Details
              </Button>
            </Link>
          </div>
        </Card>

        {profileSuccess && <Alert type="success">{profileSuccess}</Alert>}

        {/* Edit Profile Form */}
        {editing && (
          <Card className="space-y-5 border-[#a45d81]/40">
            <div>
              <h3 className="font-display text-lg font-bold text-[#5a3e57]">
                Edit Seller Profile
              </h3>
              <p className="text-xs text-[#786b75]">
                Update your store description, categories, and contact details.
              </p>
            </div>

            {profileError && <Alert type="error">{profileError}</Alert>}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Store / Business Name"
                  name="businessName"
                  value={profileForm.businessName}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, businessName: e.target.value }))
                  }
                  required
                />
                <Input
                  label="City"
                  name="city"
                  value={profileForm.city}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, city: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Contact Phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
                <Input
                  label="Social / Portfolio Link (Optional)"
                  name="socialLink"
                  type="url"
                  placeholder="https://instagram.com/yourstudio"
                  value={profileForm.socialLink}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, socialLink: e.target.value }))
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[#5a3e57]">
                  Categories <span className="text-[#a45d81]">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const active = profileForm.categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                          active
                            ? 'border-[#51394e] bg-[#51394e] text-white'
                            : 'border-[#eadfdb] bg-white text-[#695d6a] hover:bg-[#fffaf7]'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="Business Description"
                name="businessDescription"
                as="textarea"
                rows={3}
                value={profileForm.businessDescription}
                onChange={(e) =>
                  setProfileForm((p) => ({
                    ...p,
                    businessDescription: e.target.value,
                  }))
                }
                required
              />

              <div className="flex flex-wrap gap-2.5">
                <Button type="submit" loading={savingProfile} size="sm">
                  Save Seller Profile
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Seller Profile & Backend Publishing Enforcement */}
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="space-y-3">
            <div className="flex items-center gap-2 text-[#5a3e57]">
              <Store className="h-4 w-4 text-[#a45d81]" />
              <h3 className="font-display text-base font-bold">
                Seller Profile Summary
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-[#786b75]">
              {seller?.profile?.businessDescription ||
                'Add your business description using Edit Seller Profile or complete your verification application.'}
            </p>
            <dl className="grid grid-cols-2 gap-3 border-t border-[#eee1dc] pt-3 text-xs">
              <div>
                <dt className="text-[#8b7c83]">Contact Email</dt>
                <dd className="font-semibold text-[#49384b]">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-[#8b7c83]">Contact Phone</dt>
                <dd className="font-semibold text-[#49384b]">
                  {seller?.profile?.phone || user?.phone}
                </dd>
              </div>
            </dl>
            {seller?.profile?.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {seller.profile.categories.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-[#f0e8f0] px-3 py-1 text-xs font-medium text-[#73546d]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2 text-[#5a3e57]">
              {isApproved ? (
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-[#a45d81]" />
              )}
              <h3 className="font-display text-base font-bold">
                Publishing Permission Status
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-[#786b75]">
              Product and service publishing is strictly enforced on the backend.
              Only sellers with <strong>APPROVED</strong> verification status are
              permitted to publish listings.
            </p>
            {publishResult && (
              <Alert type={publishResult.type}>{publishResult.message}</Alert>
            )}
            <Button
              onClick={handlePublishCheck}
              loading={checking}
              variant={isApproved ? 'primary' : 'outline'}
              size="sm"
            >
              {isApproved
                ? 'Verify Backend Publishing Access'
                : 'Test Backend Publishing Restriction'}
            </Button>
          </Card>
        </div>

        {/* Future Products & Orders Placeholders */}
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="border-dashed bg-[#fffaf7]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4e9cb] text-[#817c31]">
                  {isApproved ? (
                    <Store className="h-5 w-5" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-[#5a3e57]">
                    My Products &amp; Services
                  </h3>
                  <p className="text-xs text-[#786b75]">
                    {isApproved
                      ? 'Verified store ready for upcoming catalog tools'
                      : 'Locked until seller verification is approved'}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#f0e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#73546d]">
                {isApproved ? 'Ready' : 'Locked'}
              </span>
            </div>
            <div className="mt-4 rounded-xl border border-[#eadfdb] bg-white p-4 text-center text-xs text-[#786b75]">
              {isApproved
                ? 'Your account is verified and authorized to publish. Product & service listing management will appear here in the next marketplace phase.'
                : 'Only verified sellers can publish products or services. Complete verification and wait for admin approval to unlock publishing.'}
            </div>
          </Card>

          <Card className="border-dashed bg-[#fffaf7]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e5def4] text-[#5a3e57]">
                  <Package className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-[#5a3e57]">
                    Seller Orders
                  </h3>
                  <p className="text-xs text-[#786b75]">
                    Manage customer requests and order fulfillment
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#f0e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#73546d]">
                Coming Soon
              </span>
            </div>
            <div className="mt-4 rounded-xl border border-[#eadfdb] bg-white p-4 text-center text-xs text-[#786b75]">
              Incoming buyer orders and custom service requests will appear here once
              marketplace transactions are enabled.
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
