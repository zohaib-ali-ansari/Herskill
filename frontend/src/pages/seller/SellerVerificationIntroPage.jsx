import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  ClipboardCheck,
  FileText,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { fetchVerificationStatus } from '../../services/sellerService';

const STEPS = [
  {
    icon: User,
    bg: 'bg-[#f8e5ed]',
    title: '1. Personal Information',
    desc: 'Legal full name, date of birth, contact details, and residential address.',
  },
  {
    icon: FileText,
    bg: 'bg-[#f4e9cb]',
    title: '2. Identity Verification',
    desc: 'CNIC number with front & back images (JPG, PNG, or PDF) stored privately.',
  },
  {
    icon: Briefcase,
    bg: 'bg-[#e5def4]',
    title: '3. Business & Portfolio',
    desc: 'Store name, category, description, and optional sample work images.',
  },
  {
    icon: ClipboardCheck,
    bg: 'bg-[#e0eddb]',
    title: '4. Review & Submit',
    desc: 'Confirm accuracy and submit for administrator verification review.',
  },
];

export default function SellerVerificationIntroPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchVerificationStatus()
      .then((data) => {
        if (active) setStatus(data?.verification?.status || 'NOT_SUBMITTED');
      })
      .catch(() => {
        if (active) setStatus('NOT_SUBMITTED');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Seller Verification">
        <Spinner label="Checking verification status..." />
      </DashboardLayout>
    );
  }

  const isSeller = user?.roles?.includes('seller');

  return (
    <DashboardLayout
      title="Seller Identity & Business Verification"
      subtitle="Keeping Her Skill a safe, trusted, women-only marketplace."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {status === 'PENDING' && (
          <Alert type="warning" title="Application Pending Review">
            Your verification application has already been submitted and is awaiting
            administrator review.{' '}
            <Link to="/seller/verification/pending" className="font-semibold underline">
              View pending status
            </Link>
          </Alert>
        )}

        {status === 'APPROVED' && (
          <Alert type="success" title="Already Verified">
            Congratulations! Your seller account has already been verified.{' '}
            <Link to="/seller/dashboard" className="font-semibold underline">
              Go to Seller Dashboard
            </Link>
          </Alert>
        )}

        <Card className="space-y-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#51394e] text-white">
              <ShieldCheck className="h-6 w-6 text-[#d2cd60]" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-[#5a3e57]">
                Why we verify every seller
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#786b75]">
                Before publishing products or services on Her Skill, every seller
                completes a one-time identity and business verification. This protects
                both female buyers and genuine women entrepreneurs.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={`${step.bg}/70 rounded-2xl border border-[#eadfdb] p-4`}
                >
                  <div className="flex items-center gap-2.5 text-[#5a3e57]">
                    <Icon className="h-4 w-4 text-[#a45d81]" />
                    <h3 className="text-sm font-bold">{step.title}</h3>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#695d6a]">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-[#d8cbd4] bg-[#f8f3f7] p-4 text-xs text-[#51394e]">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#a45d81]" />
            <p className="leading-relaxed">
              <strong>Privacy guarantee:</strong> Your CNIC number is encrypted and
              your identity documents are stored in private storage. They are never
              shared publicly and can only be viewed by authorized Her Skill
              administrators during verification review.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee1dc] pt-4">
            <Link to="/seller/verification/status">
              <Button variant="outline">View Current Status</Button>
            </Link>

            {!isSeller ? (
              <Button onClick={() => navigate('/seller/activate')}>
                Activate Seller Mode First
              </Button>
            ) : status === 'PENDING' ? (
              <Button onClick={() => navigate('/seller/verification/pending')}>
                View Pending Application
              </Button>
            ) : status === 'APPROVED' ? (
              <Button onClick={() => navigate('/seller/dashboard')}>
                <BadgeCheck className="h-4 w-4" />
                Open Seller Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/seller/verification/apply')}>
                {status === 'REJECTED'
                  ? 'Update & Resubmit Application'
                  : 'Start Verification Application'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
