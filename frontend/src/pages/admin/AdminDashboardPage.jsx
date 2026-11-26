import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Clock,
  ShoppingBag,
  Store,
  Users,
  XCircle,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { fetchAdminDashboard } from '../../services/adminService';
import { extractErrorMessage } from '../../services/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchAdminDashboard()
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(extractErrorMessage(err, 'Failed to load admin metrics.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = data?.stats || {};
  const metricCards = [
    { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, bg: 'bg-[#e5def4]', color: 'text-[#5a3e57]' },
    { label: 'Total Buyers', value: stats.totalBuyers ?? 0, icon: ShoppingBag, bg: 'bg-[#f8e5ed]', color: 'text-[#a45d81]' },
    { label: 'Total Sellers', value: stats.totalSellers ?? 0, icon: Store, bg: 'bg-[#f0e8f0]', color: 'text-[#51394e]' },
    { label: 'Pending Verifications', value: stats.pendingVerifications ?? 0, icon: Clock, bg: 'bg-[#f4e9cb]', color: 'text-[#817c31]' },
    { label: 'Approved Sellers', value: stats.approvedSellers ?? 0, icon: BadgeCheck, bg: 'bg-[#e0eddb]', color: 'text-emerald-800' },
    { label: 'Rejected Applications', value: stats.rejectedApplications ?? 0, icon: XCircle, bg: 'bg-[#f8e5ed]', color: 'text-[#8c486b]' },
  ];

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Platform overview and seller verification management."
      actions={
        <Link to="/admin/verifications">
          <Button>Review Verification Requests</Button>
        </Link>
      }
    >
      {loading ? (
        <Spinner label="Loading dashboard metrics..." />
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metricCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8b7c83]">
                      {item.label}
                    </p>
                    <p className="mt-1 font-display text-3xl font-bold text-[#5a3e57]">
                      {item.value}
                    </p>
                  </div>
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg} ${item.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </Card>
              );
            })}
          </div>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#5a3e57]">
                Recent Seller Verification Applications
              </h2>
              <Link
                to="/admin/verifications"
                className="text-xs font-semibold text-[#a45d81] hover:underline"
              >
                View all requests
              </Link>
            </div>

            {data?.recentApplications?.length === 0 ? (
              <p className="py-4 text-sm text-[#786b75]">
                No seller verification applications have been submitted yet.
              </p>
            ) : (
              <div className="divide-y divide-[#eee1dc]">
                {data?.recentApplications?.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#5a3e57]">
                        {app.businessName || app.sellerName}
                      </p>
                      <p className="text-xs text-[#786b75]">
                        {app.sellerName} • {app.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={app.status} />
                      <Link to={`/admin/verifications/${app.id}`}>
                        <Button variant="outline" size="sm">
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
