import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileUp,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchVerificationStatus,
  resubmitSellerVerification,
  submitSellerVerification,
} from '../../services/sellerService';
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

const STEPS = [
  { number: 1, title: 'Personal Info', icon: User },
  { number: 2, title: 'Identity Docs', icon: ShieldCheck },
  { number: 3, title: 'Business Info', icon: Briefcase },
  { number: 4, title: 'Review & Submit', icon: ClipboardCheck },
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IDENTITY_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_PORTFOLIO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function SellerVerificationFormPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loadingInit, setLoadingInit] = useState(true);
  const [isResubmit, setIsResubmit] = useState(false);
  const [priorDocsSummary, setPriorDocsSummary] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [form, setForm] = useState({
    legalName: user?.name || '',
    dateOfBirth: '',
    phone: user?.phone || '',
    email: user?.email || '',
    city: '',
    residentialAddress: '',
    cnicNumber: '',
    businessName: '',
    categories: [],
    businessDescription: '',
    businessCity: '',
    socialLink: '',
    declarationAccepted: false,
  });

  const [files, setFiles] = useState({
    cnicFront: null,
    cnicBack: null,
    additionalDocument: null,
    portfolioImages: [],
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetchVerificationStatus()
      .then((data) => {
        if (!active) return;
        const v = data?.verification;
        if (!v) return;

        if (v.status === 'PENDING') {
          navigate('/seller/verification/pending', { replace: true });
          return;
        }
        if (v.status === 'APPROVED') {
          navigate('/seller/verification/status', { replace: true });
          return;
        }
        if (v.status === 'REJECTED' && v.submittedInformation) {
          setIsResubmit(true);
          setRejectionReason(v.rejectionReason || '');
          setPriorDocsSummary(v.documentsSummary || null);
          const p = v.submittedInformation.personal || {};
          const b = v.submittedInformation.business || {};
          setForm((prev) => ({
            ...prev,
            legalName: p.legalName || prev.legalName,
            dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '',
            phone: p.phone || prev.phone,
            email: p.email || prev.email,
            city: p.city || '',
            residentialAddress: p.residentialAddress || '',
            businessName: b.businessName || '',
            categories: b.categories || [],
            businessDescription: b.businessDescription || '',
            businessCity: b.city || '',
            socialLink: b.socialLink || '',
            declarationAccepted: false,
          }));
        }
      })
      .finally(() => {
        if (active) setLoadingInit(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleCategory = (cat) => {
    setForm((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const handleIdentityFile = (fieldName, file) => {
    setError('');
    if (!file) {
      setFiles((prev) => ({ ...prev, [fieldName]: null }));
      return;
    }
    if (!ALLOWED_IDENTITY_TYPES.includes(file.type)) {
      setError('Identity documents must be JPG, PNG, or PDF files.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Each document must be 5MB or smaller.');
      return;
    }
    setFiles((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handlePortfolioFiles = (fileList) => {
    setError('');
    const selected = Array.from(fileList || []);
    if (selected.length > 5) {
      setError('You can upload up to 5 sample work / portfolio images.');
      return;
    }
    for (const file of selected) {
      if (!ALLOWED_PORTFOLIO_TYPES.includes(file.type)) {
        setError('Portfolio sample images must be JPG, PNG, or WEBP.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError('Each portfolio image must be 5MB or smaller.');
        return;
      }
    }
    setFiles((prev) => ({ ...prev, portfolioImages: selected }));
  };

  const validateCurrentStep = () => {
    setError('');
    if (step === 1) {
      if (
        !form.legalName.trim() ||
        !form.dateOfBirth ||
        !form.phone.trim() ||
        !form.email.trim() ||
        !form.city.trim() ||
        !form.residentialAddress.trim()
      ) {
        setError('Please complete all required personal information fields.');
        return false;
      }
      const ageYears =
        (Date.now() - new Date(form.dateOfBirth).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);
      if (Number.isNaN(ageYears) || ageYears < 18) {
        setError('You must be at least 18 years old to register as a seller.');
        return false;
      }
    }

    if (step === 2) {
      const cnicPattern = /^\d{5}-?\d{7}-?\d{1}$/;
      if (!isResubmit || form.cnicNumber.trim()) {
        if (!cnicPattern.test(form.cnicNumber.trim())) {
          setError('Enter a valid 13-digit CNIC number (e.g., 12345-1234567-1).');
          return false;
        }
      }
      if (!isResubmit && (!files.cnicFront || !files.cnicBack)) {
        setError('Please upload both CNIC front and CNIC back documents.');
        return false;
      }
      if (
        isResubmit &&
        !priorDocsSummary?.cnicFrontUploaded &&
        !files.cnicFront
      ) {
        setError('CNIC front document is required.');
        return false;
      }
      if (
        isResubmit &&
        !priorDocsSummary?.cnicBackUploaded &&
        !files.cnicBack
      ) {
        setError('CNIC back document is required.');
        return false;
      }
    }

    if (step === 3) {
      if (!form.businessName.trim()) {
        setError('Store or business name is required.');
        return false;
      }
      if (form.categories.length === 0) {
        setError('Please select at least one product or service category.');
        return false;
      }
      if (form.businessDescription.trim().length < 20) {
        setError('Business description must be at least 20 characters.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(4, prev + 1));
    }
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.declarationAccepted) {
      setError('You must accept the verification accuracy declaration before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('legalName', form.legalName.trim());
      fd.append('dateOfBirth', form.dateOfBirth);
      fd.append('phone', form.phone.trim());
      fd.append('email', form.email.trim());
      fd.append('city', form.city.trim());
      fd.append('residentialAddress', form.residentialAddress.trim());
      if (form.cnicNumber.trim()) {
        fd.append('cnicNumber', form.cnicNumber.trim());
      }
      fd.append('businessName', form.businessName.trim());
      fd.append('categories', JSON.stringify(form.categories));
      fd.append('businessDescription', form.businessDescription.trim());
      fd.append('businessCity', (form.businessCity || form.city).trim());
      if (form.socialLink.trim()) {
        fd.append('socialLink', form.socialLink.trim());
      }
      fd.append('declarationAccepted', 'true');

      if (files.cnicFront) fd.append('cnicFront', files.cnicFront);
      if (files.cnicBack) fd.append('cnicBack', files.cnicBack);
      if (files.additionalDocument) {
        fd.append('additionalDocument', files.additionalDocument);
      }
      for (const img of files.portfolioImages) {
        fd.append('portfolioImages', img);
      }

      if (isResubmit) {
        await resubmitSellerVerification(fd);
      } else {
        await submitSellerVerification(fd);
      }

      await refreshUser();
      navigate('/seller/verification/pending', { replace: true });
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          'Could not submit your verification application. Please review all fields.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInit) {
    return (
      <DashboardLayout title="Seller Verification">
        <Spinner label="Preparing verification form..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={
        isResubmit
          ? 'Resubmit Seller Verification'
          : 'Seller Verification Application'
      }
      subtitle="Complete all 4 steps to verify your identity and business."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {isResubmit && rejectionReason && (
          <Alert type="error" title="Previous Rejection Reason">
            {rejectionReason}
          </Alert>
        )}

        {/* Progress indicator */}
        <Card className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isCompleted = step > s.number;
              const isActive = step === s.number;
              return (
                <div
                  key={s.number}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition ${
                    isActive
                      ? 'border-[#a45d81] bg-[#f8e5ed]/55 text-[#5a3e57]'
                      : isCompleted
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-[#eee1dc] bg-white text-[#8b7c83]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isActive
                        ? 'bg-[#51394e] text-white'
                        : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#faf6f3] text-[#786b75]'
                    }`}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide">
                      Step {s.number}
                    </p>
                    <p className="truncate text-xs font-semibold">{s.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert type="error">{error}</Alert>}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold text-[#5a3e57]">
                  Step 1: Personal Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Legal Full Name (as on CNIC)"
                    name="legalName"
                    value={form.legalName}
                    onChange={handleFieldChange}
                    required
                  />
                  <Input
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={handleFieldChange}
                    required
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleFieldChange}
                    required
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFieldChange}
                    required
                  />
                  <Input
                    label="City"
                    name="city"
                    placeholder="Lahore"
                    value={form.city}
                    onChange={handleFieldChange}
                    required
                  />
                </div>
                <Input
                  label="Residential Address"
                  name="residentialAddress"
                  as="textarea"
                  rows={2}
                  placeholder="House, street, sector or area"
                  value={form.residentialAddress}
                  onChange={handleFieldChange}
                  required
                />
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#5a3e57]">
                    Step 2: Identity Verification
                  </h2>
                  <p className="mt-1 text-xs text-[#786b75]">
                    Accepted formats: JPG, PNG, or PDF (max 5MB per file). Documents
                    remain strictly private.
                  </p>
                </div>

                <Input
                  label={
                    isResubmit
                      ? 'CNIC Number (leave blank to keep previously submitted CNIC)'
                      : 'CNIC Number'
                  }
                  name="cnicNumber"
                  placeholder="12345-1234567-1"
                  value={form.cnicNumber}
                  onChange={handleFieldChange}
                  required={!isResubmit}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex cursor-pointer flex-col justify-between rounded-2xl border border-dashed border-[#ddd2cf] bg-[#fffaf7] p-4 hover:border-[#a45d81]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#5a3e57]">
                      <FileUp className="h-4 w-4 text-[#a45d81]" />
                      CNIC Front {!isResubmit && <span className="text-[#a45d81]">*</span>}
                    </div>
                    <p className="mt-2 text-xs text-[#786b75]">
                      {files.cnicFront
                        ? `Selected: ${files.cnicFront.name}`
                        : isResubmit && priorDocsSummary?.cnicFrontUploaded
                          ? 'Previously uploaded (select file to replace)'
                          : 'Upload JPG, PNG, or PDF'}
                    </p>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="sr-only"
                      onChange={(e) =>
                        handleIdentityFile('cnicFront', e.target.files?.[0] || null)
                      }
                    />
                  </label>

                  <label className="flex cursor-pointer flex-col justify-between rounded-2xl border border-dashed border-[#ddd2cf] bg-[#fffaf7] p-4 hover:border-[#a45d81]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#5a3e57]">
                      <FileUp className="h-4 w-4 text-[#a45d81]" />
                      CNIC Back {!isResubmit && <span className="text-[#a45d81]">*</span>}
                    </div>
                    <p className="mt-2 text-xs text-[#786b75]">
                      {files.cnicBack
                        ? `Selected: ${files.cnicBack.name}`
                        : isResubmit && priorDocsSummary?.cnicBackUploaded
                          ? 'Previously uploaded (select file to replace)'
                          : 'Upload JPG, PNG, or PDF'}
                    </p>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="sr-only"
                      onChange={(e) =>
                        handleIdentityFile('cnicBack', e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#eadfdb] bg-white p-4 hover:bg-[#fffaf7]">
                  <div>
                    <p className="text-sm font-semibold text-[#5a3e57]">
                      Additional Verification Document (Optional)
                    </p>
                    <p className="mt-0.5 text-xs text-[#786b75]">
                      {files.additionalDocument
                        ? `Selected: ${files.additionalDocument.name}`
                        : isResubmit && priorDocsSummary?.additionalDocumentUploaded
                          ? 'Previously uploaded (select file to replace)'
                          : 'Utility bill, business certificate, or supporting proof (JPG, PNG, PDF)'}
                    </p>
                  </div>
                  <FileUp className="h-5 w-5 text-[#a45d81]" />
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="sr-only"
                    onChange={(e) =>
                      handleIdentityFile(
                        'additionalDocument',
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </label>

                <div className="flex items-center gap-2 rounded-xl bg-[#f8f3f7] px-3.5 py-2.5 text-xs text-[#51394e]">
                  <Lock className="h-4 w-4 shrink-0 text-[#a45d81]" />
                  <span>
                    Identity documents are stored privately and accessible only to
                    authorized administrators.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-bold text-[#5a3e57]">
                  Step 3: Seller &amp; Business Information
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Store / Business Name"
                    name="businessName"
                    placeholder="Zoya Handmade Studio"
                    value={form.businessName}
                    onChange={handleFieldChange}
                    required
                  />
                  <Input
                    label="Business City"
                    name="businessCity"
                    placeholder={form.city || 'Lahore'}
                    value={form.businessCity}
                    onChange={handleFieldChange}
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-[#5a3e57]">
                    Product or Service Category <span className="text-[#a45d81]">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const active = form.categories.includes(cat);
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
                  rows={4}
                  placeholder="Describe the handmade products or services you offer (minimum 20 characters)..."
                  value={form.businessDescription}
                  onChange={handleFieldChange}
                  required
                />

                <Input
                  label="Social Media or Portfolio Link (Optional)"
                  name="socialLink"
                  type="url"
                  placeholder="https://instagram.com/yourstudio"
                  value={form.socialLink}
                  onChange={handleFieldChange}
                />

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#ddd2cf] bg-[#fffaf7] p-4 hover:border-[#a45d81]">
                  <div>
                    <p className="text-sm font-semibold text-[#5a3e57]">
                      Sample Work / Portfolio Images (Optional, up to 5 images)
                    </p>
                    <p className="mt-0.5 text-xs text-[#786b75]">
                      {files.portfolioImages.length > 0
                        ? `${files.portfolioImages.length} file(s) selected: ${files.portfolioImages
                            .map((f) => f.name)
                            .join(', ')}`
                        : isResubmit && priorDocsSummary?.portfolioCount > 0
                          ? `${priorDocsSummary.portfolioCount} sample image(s) previously uploaded (select to replace)`
                          : 'JPG, PNG, or WEBP (max 5MB each)'}
                    </p>
                  </div>
                  <FileUp className="h-5 w-5 text-[#a45d81]" />
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={(e) => handlePortfolioFiles(e.target.files)}
                  />
                </label>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-bold text-[#5a3e57]">
                  Step 4: Review &amp; Submit
                </h2>

                <div className="grid gap-4 rounded-2xl border border-[#eadfdb] bg-[#fffaf7] p-5 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#8b7c83]">Legal Full Name</p>
                    <p className="font-semibold text-[#49384b]">{form.legalName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b7c83]">Date of Birth</p>
                    <p className="font-semibold text-[#49384b]">{form.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b7c83]">Phone &amp; Email</p>
                    <p className="font-semibold text-[#49384b]">
                      {form.phone} • {form.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b7c83]">City &amp; Address</p>
                    <p className="font-semibold text-[#49384b]">
                      {form.city} — {form.residentialAddress}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b7c83]">CNIC Number</p>
                    <p className="font-mono text-xs font-semibold text-[#49384b]">
                      {form.cnicNumber
                        ? `*****-*******-${form.cnicNumber.replace(/\D/g, '').slice(-1)}`
                        : 'Using previously submitted CNIC'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b7c83]">Identity Documents</p>
                    <p className="font-semibold text-[#49384b]">
                      Front: {files.cnicFront?.name || 'Previously uploaded'} | Back:{' '}
                      {files.cnicBack?.name || 'Previously uploaded'}
                      {files.additionalDocument
                        ? ` | Extra: ${files.additionalDocument.name}`
                        : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b7c83]">Business / Store Name</p>
                    <p className="font-semibold text-[#49384b]">
                      {form.businessName} ({form.businessCity || form.city})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b7c83]">Categories</p>
                    <p className="font-semibold text-[#49384b]">
                      {form.categories.join(', ')}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-[#8b7c83]">Business Description</p>
                    <p className="mt-0.5 text-[#49384b]">{form.businessDescription}</p>
                  </div>
                  {(form.socialLink || files.portfolioImages.length > 0) && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-[#8b7c83]">Portfolio &amp; Links</p>
                      <p className="mt-0.5 text-xs font-medium text-[#49384b]">
                        {form.socialLink ? `Link: ${form.socialLink}` : ''}
                        {form.socialLink && files.portfolioImages.length > 0 ? ' • ' : ''}
                        {files.portfolioImages.length > 0
                          ? `Samples: ${files.portfolioImages.map((f) => f.name).join(', ')}`
                          : ''}
                      </p>
                    </div>
                  )}
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#d8cbd4] bg-[#f8f3f7] p-4 text-sm text-[#49384b]">
                  <input
                    type="checkbox"
                    name="declarationAccepted"
                    checked={form.declarationAccepted}
                    onChange={handleFieldChange}
                    className="mt-1 h-4 w-4 rounded border-[#ddd2cf] text-[#a45d81] focus:ring-[#a45d81]"
                  />
                  <span className="leading-relaxed">
                    I declare that all submitted personal, identity, and business
                    information is accurate and belongs to me, and I agree to the{' '}
                    <strong>Her Skill Seller Verification Policy</strong>.
                  </span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[#eee1dc] pt-5">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" loading={submitting}>
                  {isResubmit ? 'Resubmit Application' : 'Submit Application'}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
