import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound, Mail, Phone } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import {
  resendVerificationCode,
  verifyContactCode,
} from '../../services/authService';
import { extractErrorMessage } from '../../services/api';

export default function VerifyAccountPage() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [method, setMethod] = useState('email');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState(
    location.state?.verificationDelivery?.devVerificationCode || ''
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (user?.isContactVerified) {
    return (
      <AuthLayout title="Account Verified">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm text-[#786b75]">
            Your contact information has already been verified.
          </p>
          <Button
            className="w-full"
            onClick={() =>
              navigate(
                user.roles?.includes('seller') && user.activeMode === 'seller'
                  ? '/seller/verification/intro'
                  : '/buyer/dashboard'
              )
            }
          >
            Continue to Dashboard
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!code.trim()) {
      setError('Please enter your verification code.');
      return;
    }
    setLoading(true);
    try {
      await verifyContactCode({ code: code.trim(), method });
      await refreshUser();
      setSuccess('Your account has been verified!');
      setTimeout(() => {
        navigate('/buyer/dashboard');
      }, 800);
    } catch (err) {
      setError(extractErrorMessage(err, 'Verification failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);
    try {
      const data = await resendVerificationCode();
      if (data?.verificationDelivery?.devVerificationCode) {
        setDevCode(data.verificationDelivery.devVerificationCode);
      }
      setSuccess(data.message);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not resend verification code.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your contact details"
      subtitle="Confirm your email address or phone number to activate full buyer access."
    >
      <form onSubmit={handleVerify} className="space-y-5">
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        {devCode && (
          <Alert type="info" title="Local Development Notice">
            External email/SMS delivery is not configured. Use verification code:{' '}
            <strong className="font-mono">{devCode}</strong>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMethod('email')}
            className={`flex items-center gap-2 rounded-2xl border p-3 text-xs font-semibold cursor-pointer ${
              method === 'email'
                ? 'border-[#a45d81] bg-[#f8e5ed]/55 text-[#5a3e57]'
                : 'border-[#eadfdb] text-[#695d6a]'
            }`}
          >
            <Mail className="h-4 w-4 text-[#a45d81]" />
            Verify Email
          </button>
          <button
            type="button"
            onClick={() => setMethod('phone')}
            className={`flex items-center gap-2 rounded-2xl border p-3 text-xs font-semibold cursor-pointer ${
              method === 'phone'
                ? 'border-[#a45d81] bg-[#f8e5ed]/55 text-[#5a3e57]'
                : 'border-[#eadfdb] text-[#695d6a]'
            }`}
          >
            <Phone className="h-4 w-4 text-[#a45d81]" />
            Verify Phone
          </button>
        </div>

        <Input
          label="6-Digit Verification Code"
          name="code"
          type="text"
          icon={KeyRound}
          placeholder="Enter verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Verify &amp; Continue
        </Button>

        <div className="flex items-center justify-between border-t border-[#eee1dc] pt-4 text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-[#a45d81] hover:underline cursor-pointer"
          >
            {resending ? 'Generating code...' : 'Resend verification code'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/buyer/dashboard')}
            className="text-[#786b75] hover:text-[#5a3e57] cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
