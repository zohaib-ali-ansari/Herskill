import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Store, UserCheck } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessage } from '../../services/api';

export default function ActivateSellerPage() {
  const { user, activateSeller } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const alreadySeller = user?.roles?.includes('seller');

  const handleActivate = async () => {
    setError('');
    setLoading(true);
    try {
      await activateSeller();
      navigate('/seller/verification/intro');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not activate seller mode.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Activate Seller Mode"
      subtitle="Sell handmade products or offer your professional services using your existing Her Skill account."
    >
      <div className="mx-auto max-w-2xl">
        <Card className="space-y-6">
          {error && <Alert type="error">{error}</Alert>}

          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4e9cb] text-[#817c31]">
              <Store className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-[#5a3e57]">
                One account for both buying and selling
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#786b75]">
                Your current account ({user?.email}) is registered as a Buyer. You do
                not need to create a separate account—activating Seller mode adds
                seller onboarding to this account.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-[#eadfdb] bg-[#fffaf7] p-4 text-sm text-[#49384b]">
            <div className="flex items-center gap-2.5">
              <UserCheck className="h-4 w-4 text-[#a45d81]" />
              <span>Keep your existing buyer profile and login credentials.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#a45d81]" />
              <span>
                Complete the 4-step seller verification before publishing products or
                services.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {alreadySeller ? (
              <Link to="/seller/verification/intro">
                <Button>Continue to Seller Verification</Button>
              </Link>
            ) : (
              <Button onClick={handleActivate} loading={loading}>
                Activate Seller Mode &amp; Start Verification
              </Button>
            )}
            <Link to="/buyer/dashboard">
              <Button variant="outline">Back to Buyer Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
