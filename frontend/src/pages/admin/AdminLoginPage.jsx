import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessage } from '../../services/api';

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Administrator email and password are required.');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(form);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Administrator authentication failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Administrator Portal"
      subtitle="Protected access for Her Skill verification reviewers and administrators."
      badge="Admin Restricted"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <Alert type="error">{error}</Alert>}

        <div className="flex items-center gap-2.5 rounded-2xl border border-[#d8cbd4] bg-[#f8f3f7] px-3.5 py-3 text-xs text-[#51394e]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#a45d81]" />
          <span>
            Admin accounts cannot be registered publicly and are provisioned securely
            by platform administrators.
          </span>
        </div>

        <Input
          label="Admin Email"
          name="email"
          type="email"
          icon={Mail}
          placeholder="admin@herskill.local"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          required
        />

        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="Enter administrator password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
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

        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#695d6a]">
          <input
            type="checkbox"
            checked={form.rememberMe}
            onChange={(e) => setForm((p) => ({ ...p, rememberMe: e.target.checked }))}
            className="h-4 w-4 rounded border-[#ddd2cf] text-[#a45d81] focus:ring-[#a45d81]"
          />
          Keep me signed in
        </label>

        <Button type="submit" variant="plum" loading={loading} className="w-full" size="lg">
          Sign In to Admin Portal
        </Button>

        <p className="border-t border-[#eee1dc] pt-4 text-center text-xs text-[#786b75]">
          Not an administrator?{' '}
          <Link to="/login" className="font-semibold text-[#a45d81] hover:underline">
            Go to Member Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
