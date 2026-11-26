import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Eye,
  EyeOff,
  FileText,
  History,
  Lock,
  XCircle,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import {
  approveSellerVerification,
  fetchAdminVerificationDetail,
  fetchProtectedFileBlobUrl,
  rejectSellerVerification,
} from '../../services/adminService';
import { extractErrorMessage } from '../../services/api';

function SecureDocumentPreview({ title, doc }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [mimeType, setMimeType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (!doc) {
    return null;
  }

  const handleLoadPreview = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchProtectedFileBlobUrl(doc.endpoint);
      setBlobUrl(result.blobUrl);
      setMimeType(result.mimeType || doc.mimeType);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load private document.'));
    } finally {
      setLoading(false);
    }
  };

  const isPdf = (mimeType || doc.mimeType || '').includes('pdf');

  return (
    <div className="space-y-3 rounded-2xl border border-[#eadfdb] bg-[#fffaf7] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#5a3e57]">{title}</p>
          <p className="truncate text-xs text-[#8b7c83]">
            {doc.originalName} ({Math.round((doc.size || 0) / 1024)} KB)
          </p>
        </div>

        {!blobUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleLoadPreview}
            loading={loading}
          >
            <Eye className="h-3.5 w-3.5" />
            View Securely
          </Button>
        )}
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {blobUrl && (
        <div className="space-y-2">
          {isPdf ? (
            <div className="flex items-center justify-between rounded-xl border border-[#eadfdb] bg-white p-3 text-xs">
              <span className="flex items-center gap-2 font-semibold text-[#49384b]">
                <FileText className="h-4 w-4 text-[#a45d81]" />
                PDF Document loaded securely
              </span>
              <a
                href={blobUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#a45d81] underline"
              >
                Open PDF in New Tab
              </a>
            </div>
          ) : (
            <img
              src={blobUrl}
              alt={title}
              className="max-h-64 w-full rounded-xl border border-[#eadfdb] bg-white object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminVerificationDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [showCnic, setShowCnic] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminVerificationDetail(id);
      setDetail(data.verification);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load application details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    fetchAdminVerificationDetail(id)
      .then((data) => {
        if (!active) return;
        setDetail(data.verification);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(extractErrorMessage(err, 'Unable to load application details.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleApprove = async () => {
    setSubmittingDecision(true);
    setError('');
    setActionMsg('');
    try {
      const res = await approveSellerVerification(id);
      setActionMsg(res.message);
      await loadDetail();
    } catch (err) {
      setError(extractErrorMessage(err, 'Approval failed.'));
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setSubmittingDecision(true);
    setError('');
    setActionMsg('');
    try {
      const res = await rejectSellerVerification(id, rejectionReason);
      setActionMsg(res.message);
      setRejectOpen(false);
      setRejectionReason('');
      await loadDetail();
    } catch (err) {
      setError(extractErrorMessage(err, 'Rejection failed.'));
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <DashboardLayout
      title="Verification Application Review"
      subtitle="Verify seller identity and business details before granting publishing permissions."
      actions={
        <Link to="/admin/verifications">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      }
    >
      {loading ? (
        <Spinner label="Loading verification details..." />
      ) : error && !detail ? (
        <Alert type="error">{error}</Alert>
      ) : (
        detail && (
          <div className="space-y-6">
            {error && <Alert type="error">{error}</Alert>}
            {actionMsg && <Alert type="success">{actionMsg}</Alert>}

            {/* Header summary & decision actions */}
            <Card className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-display text-2xl font-bold text-[#5a3e57]">
                    {detail.business?.businessName}
                  </h2>
                  <StatusBadge status={detail.status} />
                </div>
                <p className="text-xs text-[#786b75]">
                  Applicant: {detail.personal?.legalName} • Submitted{' '}
                  {new Date(detail.submittedAt).toLocaleString()}
                </p>
                {detail.reviewedAt && (
                  <p className="text-xs text-[#8b7c83]">
                    Reviewed by {detail.reviewedBy?.name || 'Admin'} on{' '}
                    {new Date(detail.reviewedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {detail.status === 'PENDING' && (
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    onClick={handleApprove}
                    loading={submittingDecision}
                  >
                    <BadgeCheck className="h-4 w-4" />
                    Approve Seller
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setRejectOpen((prev) => !prev)}
                    disabled={submittingDecision}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Application
                  </Button>
                </div>
              )}
            </Card>

            {detail.status === 'REJECTED' && detail.rejectionReason && (
              <Alert type="error" title="Recorded Rejection Reason">
                {detail.rejectionReason}
              </Alert>
            )}

            {rejectOpen && detail.status === 'PENDING' && (
              <Card className="border-rose-300 bg-[#f8e5ed]/35">
                <form onSubmit={handleReject} className="space-y-4">
                  <Input
                    label="Rejection Reason (shared with the seller so they can fix and resubmit)"
                    name="rejectionReason"
                    as="textarea"
                    rows={3}
                    placeholder="e.g., CNIC back image is blurry and unreadable. Please upload a clearer photo."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="danger"
                      loading={submittingDecision}
                    >
                      Confirm Rejection
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRejectOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Personal & Identity info */}
              <Card className="space-y-4">
                <h3 className="font-display text-lg font-bold text-[#5a3e57]">
                  Personal &amp; Identity Information
                </h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-[#8b7c83]">Legal Full Name</dt>
                    <dd className="font-semibold text-[#49384b]">
                      {detail.personal?.legalName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#8b7c83]">Date of Birth</dt>
                    <dd className="font-semibold text-[#49384b]">
                      {detail.personal?.dateOfBirth
                        ? new Date(detail.personal.dateOfBirth).toLocaleDateString()
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#8b7c83]">Phone</dt>
                    <dd className="font-semibold text-[#49384b]">
                      {detail.personal?.phone}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#8b7c83]">Email</dt>
                    <dd className="font-semibold text-[#49384b]">
                      {detail.personal?.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#8b7c83]">City</dt>
                    <dd className="font-semibold text-[#49384b]">
                      {detail.personal?.city}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#8b7c83]">CNIC Number</dt>
                    <dd className="flex items-center gap-2 font-mono text-xs font-semibold text-[#49384b]">
                      <span>
                        {showCnic
                          ? detail.identity?.cnicNumber
                          : detail.identity?.cnicMasked}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCnic((prev) => !prev)}
                        className="rounded p-1 text-[#a45d81] hover:bg-[#f0e8f0] cursor-pointer"
                        title={showCnic ? 'Mask CNIC' : 'Reveal CNIC for verification'}
                      >
                        {showCnic ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-[#8b7c83]">Residential Address</dt>
                    <dd className="font-semibold text-[#49384b]">
                      {detail.personal?.residentialAddress}
                    </dd>
                  </div>
                </dl>
              </Card>

              {/* Business Info */}
              <Card className="space-y-4">
                <h3 className="font-display text-lg font-bold text-[#5a3e57]">
                  Business &amp; Portfolio Information
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-[#8b7c83]">Store / Business Name</dt>
                    <dd className="font-semibold text-[#49384b]">
                      {detail.business?.businessName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#8b7c83]">Categories</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {detail.business?.categories?.map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-[#f0e8f0] px-2.5 py-0.5 text-xs font-semibold text-[#73546d]"
                        >
                          {cat}
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#8b7c83]">Business Description</dt>
                    <dd className="mt-0.5 leading-relaxed text-[#49384b]">
                      {detail.business?.businessDescription}
                    </dd>
                  </div>
                  {detail.business?.socialLink && (
                    <div>
                      <dt className="text-xs text-[#8b7c83]">
                        Social / Portfolio Link
                      </dt>
                      <dd>
                        <a
                          href={detail.business.socialLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#a45d81] underline"
                        >
                          {detail.business.socialLink}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>
            </div>

            {/* Protected Identity Documents */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#5a3e57]">
                  <Lock className="h-4 w-4 text-[#a45d81]" />
                  <h3 className="font-display text-lg font-bold">
                    Private Identity Documents
                  </h3>
                </div>
                <span className="text-xs text-[#8b7c83]">
                  Protected admin-only access
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SecureDocumentPreview
                  title="CNIC Front"
                  doc={detail.documents?.cnicFront}
                />
                <SecureDocumentPreview
                  title="CNIC Back"
                  doc={detail.documents?.cnicBack}
                />
                {detail.documents?.additionalDocument && (
                  <SecureDocumentPreview
                    title="Additional Verification Document"
                    doc={detail.documents.additionalDocument}
                  />
                )}
              </div>

              {detail.portfolioImages?.length > 0 && (
                <div className="space-y-3 border-t border-[#eee1dc] pt-4">
                  <h4 className="text-sm font-bold text-[#5a3e57]">
                    Sample Work / Portfolio Images
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {detail.portfolioImages.map((img, idx) => (
                      <SecureDocumentPreview
                        key={img.storageKey}
                        title={`Portfolio Sample #${idx + 1}`}
                        doc={img}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Decision history */}
            {detail.applicationHistory?.length > 0 && (
              <Card className="space-y-4">
                <div className="flex items-center gap-2 text-[#5a3e57]">
                  <History className="h-4 w-4 text-[#a45d81]" />
                  <h3 className="font-display text-lg font-bold">
                    Application Decision History
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {[...detail.applicationHistory].reverse().map((entry) => (
                    <div
                      key={entry.submissionNumber}
                      className="flex flex-col justify-between gap-2 rounded-2xl border border-[#eadfdb] p-3.5 text-xs sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#5a3e57]">
                            Submission #{entry.submissionNumber}
                          </span>
                          <StatusBadge status={entry.status} />
                        </div>
                        {entry.rejectionReason && (
                          <p className="text-[#8c486b]">
                            Reason: {entry.rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="text-[#8b7c83] sm:text-right">
                        <p>
                          Submitted:{' '}
                          {new Date(entry.submittedAt).toLocaleString()}
                        </p>
                        {entry.reviewedAt && (
                          <p>
                            Reviewed by {entry.reviewedBy?.name || 'Admin'} on{' '}
                            {new Date(entry.reviewedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )
      )}
    </DashboardLayout>
  );
}
