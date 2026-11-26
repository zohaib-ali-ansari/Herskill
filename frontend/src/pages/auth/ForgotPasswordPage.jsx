import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { requestPasswordReset } from '../../services/authService';
import { extractErrorMessage } from '../../services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldError('');
    setResult(null);

    if (!EMAIL_RE.test(email.trim())) {
      setFieldError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await requestPasswordReset({ email: email.trim() });
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to process password reset request.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your registered email address to receive password reset instructions."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <Alert type="error">{error}</Alert>}

        {result && (
          <Alert type="success" title="Reset Request Processed">
            <p>{result.message}</p>
            {result.devResetToken && (
              <div className="mt-2 rounded-xl bg-white/90 p-3 text-xs text-[#49384b]">
                <p className="font-semibold">Local Dev Reset Link:</p>
                <Link
                  to={`/reset-password?token=${encodeURIComponent(result.devResetToken)}`}
                  className="mt-1 inline-block break-all font-semibold text-[#a45d81] underline"
                >
                  Continue to Reset Password
                </Link>
              </div>
            )}
          </Alert>
        )}

        <Input
          label="Email Address"
          name="email"
          type="email"
          icon={Mail}
          placeholder="amina@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldError('');
          }}
          error={fieldError}
          required
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send Reset Instructions
        </Button>

        <div className="border-t border-[#eee1dc] pt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#a45d81] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
