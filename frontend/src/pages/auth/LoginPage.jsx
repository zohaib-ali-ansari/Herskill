import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShoppingBag,
  Store,
} from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessage } from '../../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    identifier: '',
    password: '',
    rememberMe: true,
    requestedMode: 'buyer',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.identifier.trim()) {
      errs.identifier = 'Email or phone number is required.';
    }
    if (!form.password) {
      errs.password = 'Password is required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await login(form);
      const target = data?.modeGuidance?.redirectTo || '/buyer/dashboard';
      navigate(target, { state: { modeGuidance: data?.modeGuidance } });
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Unable to sign in. Please check your credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back to Her Skill"
      subtitle="Choose how you want to continue and sign in to your account."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <p className="mb-2.5 text-sm font-semibold text-[#5a3e57]">
            Continue as
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, requestedMode: 'buyer' }))}
              className={`relative flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                form.requestedMode === 'buyer'
                  ? 'border-[#a45d81] bg-[#f8e5ed]/60 text-[#5a3e57] ring-2 ring-[#a45d81]/20'
                  : 'border-[#eadfdb] bg-white text-[#695d6a] hover:bg-[#fffaf7]'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f8e5ed] text-[#a45d81]">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#5a3e57]">Buyer</p>
                <p className="truncate text-[11px] text-[#786b75]">Shop &amp; book</p>
              </div>
              {form.requestedMode === 'buyer' && (
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-[#a45d81]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, requestedMode: 'seller' }))}
              className={`relative flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                form.requestedMode === 'seller'
                  ? 'border-[#a45d81] bg-[#f4e9cb]/60 text-[#5a3e57] ring-2 ring-[#a45d81]/20'
                  : 'border-[#eadfdb] bg-white text-[#695d6a] hover:bg-[#fffaf7]'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4e9cb] text-[#817c31]">
                <Store className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#5a3e57]">Seller</p>
                <p className="truncate text-[11px] text-[#786b75]">Manage studio</p>
              </div>
              {form.requestedMode === 'seller' && (
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-[#a45d81]" />
              )}
            </button>
          </div>
        </div>

        <Input
          label="Email or Phone Number"
          name="identifier"
          type="text"
          icon={Mail}
          placeholder="Email or +923001234567"
          value={form.identifier}
          onChange={handleChange}
          error={fieldErrors.identifier}
          required
        />

        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="Enter your password"
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-[#695d6a]">
            <input
              type="checkbox"
              name="rememberMe"
              checked={form.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-[#ddd2cf] text-[#a45d81] focus:ring-[#a45d81]"
            />
            Remember me
          </label>

          <Link
            to="/forgot-password"
            className="font-semibold text-[#a45d81] hover:text-[#5a3e57] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In as {form.requestedMode === 'seller' ? 'Seller' : 'Buyer'}
        </Button>

        <div className="space-y-2 border-t border-[#eee1dc] pt-4 text-center text-sm text-[#786b75]">
          <p>
            New to Her Skill?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#a45d81] hover:text-[#5a3e57] hover:underline"
            >
              Create an account
            </Link>
          </p>
          <p className="text-xs text-[#8b7c83]">
            Platform Administrator?{' '}
            <Link
              to="/admin/login"
              className="font-semibold text-[#5a3e57] hover:underline"
            >
              Admin Portal Sign In
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
