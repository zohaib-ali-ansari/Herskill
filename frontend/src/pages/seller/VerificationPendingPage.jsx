import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { fetchVerificationStatus } from '../../services/sellerService';

export default function VerificationPendingPage() {
  const { switchMode } = useAuth();
  const navigate = useNavigate();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let active = true;
    fetchVerificationStatus()
      .then((data) => {
        if (active) setVerification(data.verification);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSwitchBuyer = async () => {
    setSwitching(true);
    try {
      await switchMode('buyer');
      navigate('/buyer/dashboard');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <DashboardLayout
      title="Verification Pending"
      subtitle="Our team is reviewing your seller verification application."
    >
      <div className="mx-auto max-w-xl">
        {loading ? (
          <Spinner label="Loading application status..." />
        ) : (
          <Card className="space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4e9cb] text-[#817c31]">
              <Clock className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <StatusBadge status={verification?.status || 'PENDING'} />
              <h2 className="font-display text-2xl font-bold text-[#5a3e57]">
                Application Under Review
              </h2>
              <p className="text-sm leading-relaxed text-[#786b75]">
                Your verification application has been submitted and is waiting for
                admin review.
              </p>
            </div>

            {verification?.submittedAt && (
              <div className="rounded-2xl border border-[#eadfdb] bg-[#fffaf7] p-4 text-left text-xs text-[#49384b]">
                <div className="flex justify-between py-1">
                  <span className="text-[#8b7c83]">Submitted on</span>
                  <span className="font-semibold">
                    {new Date(verification.submittedAt).toLocaleString()}
                  </span>
                </div>
                {verification?.submittedInformation?.business?.businessName && (
                  <div className="flex justify-between py-1">
                    <span className="text-[#8b7c83]">Business name</span>
                    <span className="font-semibold">
                      {verification.submittedInformation.business.businessName}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-2xl bg-[#f8f3f7] p-3.5 text-left text-xs text-[#51394e]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#a45d81]" />
              <span>
                You can access your basic Seller Account page or switch to Buyer mode,
                but you cannot publish products or services until an administrator
                approves your verification.
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/seller/dashboard">
                <Button>Go to Seller Account</Button>
              </Link>
              <Link to="/seller/verification/status">
                <Button variant="outline">Verification Details</Button>
              </Link>
              <Button
                variant="secondary"
                onClick={handleSwitchBuyer}
                loading={switching}
              >
                Switch to Buyer Mode
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
