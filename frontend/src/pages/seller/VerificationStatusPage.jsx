import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Clock,
  FileEdit,
  History,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { fetchVerificationStatus } from '../../services/sellerService';
import { extractErrorMessage } from '../../services/api';

export default function VerificationStatusPage() {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchVerificationStatus()
      .then((data) => {
        if (active) setVerification(data.verification);
      })
      .catch((err) => {
        if (active) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const status = verification?.status || 'NOT_SUBMITTED';

  return (
    <DashboardLayout
      title="Seller Verification Status"
      subtitle="Track your verification progress and decision history."
      actions={
        <Link to="/seller/dashboard">
          <Button variant="outline" size="sm">
            Back to Seller Account
          </Button>
        </Link>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {loading ? (
          <Spinner label="Loading verification status..." />
        ) : error ? (
          <Alert type="error">{error}</Alert>
        ) : (
          <>
            <Card className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {status === 'APPROVED' && (
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <BadgeCheck className="h-6 w-6" />
                    </span>
                  )}
                  {status === 'PENDING' && (
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4e9cb] text-[#817c31]">
                      <Clock className="h-6 w-6" />
                    </span>
                  )}
                  {status === 'REJECTED' && (
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8e5ed] text-[#8c486b]">
                      <XCircle className="h-6 w-6" />
                    </span>
                  )}
                  {status === 'NOT_SUBMITTED' && (
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8f3f7] text-[#695d6a]">
                      <FileEdit className="h-6 w-6" />
                    </span>
                  )}

                  <div>
                    <p className="text-xs font-medium text-[#8b7c83]">
                      Current Verification Status
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={status} />
                      {status === 'APPROVED' && (
                        <span className="text-xs font-semibold text-emerald-700">
                          Verified Seller Badge Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {status === 'NOT_SUBMITTED' && (
                  <Link to="/seller/verification/apply">
                    <Button>Start Application</Button>
                  </Link>
                )}
                {status === 'APPROVED' && (
                  <Link to="/seller/dashboard">
                    <Button>Open Seller Dashboard</Button>
                  </Link>
                )}
                {status === 'REJECTED' && (
                  <Link to="/seller/verification/apply">
                    <Button>
                      <RefreshCw className="h-4 w-4" />
                      Update &amp; Resubmit
                    </Button>
                  </Link>
                )}
              </div>

              {status === 'NOT_SUBMITTED' && (
                <Alert type="info">
                  You have not submitted a seller verification application yet.
                  Complete the 4-step verification form to become a verified seller.
                </Alert>
              )}

              {status === 'PENDING' && (
                <Alert type="warning">
                  Your verification application has been submitted and is waiting for
                  admin review.
                </Alert>
              )}

              {status === 'APPROVED' && (
                <Alert type="success">
                  Congratulations! Your seller account has been verified. Your Verified
                  Seller badge is active and you are permitted to publish products or
                  services.
                </Alert>
              )}

              {status === 'REJECTED' && (
                <Alert type="error" title="Application Rejected">
                  <p>
                    <strong>Reason:</strong>{' '}
                    {verification?.rejectionReason ||
                      'Please review your details and resubmit.'}
                  </p>
                </Alert>
              )}

              {verification?.submittedInformation && (
                <div className="grid gap-4 rounded-2xl border border-[#eadfdb] bg-[#fffaf7] p-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#8b7c83]">Legal Full Name</p>
                    <p className="font-semibold text-[#49384b]">
                      {verification.submittedInformation.personal?.legalName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b7c83]">Business / Store Name</p>
                    <p className="font-semibold text-[#49384b]">
                      {verification.submittedInformation.business?.businessName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b7c83]">CNIC (Masked)</p>
                    <p className="font-mono text-xs font-semibold text-[#49384b]">
                      {verification.submittedInformation.identity?.cnicMasked}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8b7c83]">City</p>
                    <p className="font-semibold text-[#49384b]">
                      {verification.submittedInformation.business?.city}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {verification?.applicationHistory?.length > 0 && (
              <Card className="space-y-4">
                <div className="flex items-center gap-2 text-[#5a3e57]">
                  <History className="h-4 w-4 text-[#a45d81]" />
                  <h2 className="font-display text-lg font-bold">
                    Application History
                  </h2>
                </div>

                <div className="space-y-3">
                  {[...verification.applicationHistory].reverse().map((entry) => (
                    <div
                      key={entry.submissionNumber}
                      className="flex flex-col justify-between gap-2 rounded-2xl border border-[#eadfdb] bg-white p-4 text-sm sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#5a3e57]">
                            Submission #{entry.submissionNumber}
                          </span>
                          <StatusBadge status={entry.status} />
                        </div>
                        <p className="text-xs text-[#786b75]">
                          {entry.snapshot?.businessName} • {entry.snapshot?.city}
                        </p>
                        {entry.rejectionReason && (
                          <p className="text-xs font-medium text-[#8c486b]">
                            Rejection reason: {entry.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="text-xs text-[#8b7c83] sm:text-right">
                        <p>
                          Submitted:{' '}
                          {new Date(entry.submittedAt).toLocaleDateString()}
                        </p>
                        {entry.reviewedAt && (
                          <p>
                            Reviewed:{' '}
                            {new Date(entry.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
