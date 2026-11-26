import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { resetPasswordWithToken } from '../../services/authService';
import { extractErrorMessage } from '../../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    token: searchParams.get('token') || '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.token.trim()) {
      errs.token = 'Reset token is required.';
    }
    if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await resetPasswordWithToken(form);
      setSuccess(data.message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(extractErrorMessage(err, 'Password reset failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Choose a strong new password for your Her Skill account."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <Input
          label="Reset Token"
          name="token"
          type="text"
          icon={KeyRound}
          placeholder="Paste your password reset token"
          value={form.token}
          onChange={handleChange}
          error={fieldErrors.token}
          required
        />

        <Input
          label="New Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="Minimum 8 characters"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="rounded-lg p-1.5 text-[#8b7c83] hover:text-[#5a3e57] cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="Re-enter your new password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
          required
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Reset Password
        </Button>

        <p className="border-t border-[#eee1dc] pt-4 text-center text-sm text-[#786b75]">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-[#a45d81] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
