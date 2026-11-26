import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { fetchAdminVerifications } from '../../services/adminService';
import { extractErrorMessage } from '../../services/api';

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All Applications' },
];

export default function AdminVerificationsPage() {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchAdminVerifications({
      status: statusFilter,
      search: search.trim() || undefined,
    })
      .then((data) => {
        if (!active) return;
        setApplications(data.verifications || []);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to load verification requests.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [statusFilter, search]);

  return (
    <DashboardLayout
      title="Seller Verification Requests"
      subtitle="Inspect seller details, review private identity documents, and record approval or rejection decisions."
    >
      <div className="space-y-5">
        <Card className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-[#51394e] text-white shadow-sm'
                    : 'bg-[#faf6f3] text-[#695d6a] hover:bg-[#f0e8f0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <Input
              icon={Search}
              placeholder="Search name, business, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <Spinner label="Loading verification applications..." />
        ) : applications.length === 0 ? (
          <Card className="py-10 text-center text-sm text-[#786b75]">
            No seller verification applications match this filter.
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <Card
                key={app.id}
                className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-[#5a3e57]">
                      {app.businessName || app.legalName}
                    </h3>
                    <StatusBadge status={app.status} />
                    {app.submissionCount > 1 && (
                      <span className="rounded-full bg-[#f0e8f0] px-2.5 py-0.5 text-[11px] font-semibold text-[#73546d]">
                        Attempt #{app.submissionCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#695d6a]">
                    Applicant: <strong>{app.legalName}</strong> ({app.accountEmail}) •{' '}
                    {app.city}
                  </p>
                  <p className="text-xs text-[#8b7c83]">
                    Categories: {app.categories?.join(', ') || '—'} • Submitted:{' '}
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </p>
                </div>

                <Link to={`/admin/verifications/${app.id}`}>
                  <Button size="sm">Review Application</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
