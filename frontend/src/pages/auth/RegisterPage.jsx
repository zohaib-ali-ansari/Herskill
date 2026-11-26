import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShoppingBag,
  Store,
  User,
} from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessage } from '../../services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s-]{8,18}$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    accountType: 'buyer',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (form.name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters.';
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!PHONE_RE.test(form.phone.trim())) {
      errs.phone = 'Enter a valid phone number (e.g., +923001234567).';
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
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await register(form);
      if (form.accountType === 'seller') {
        navigate('/seller/verification/intro', {
          state: { verificationDelivery: data?.verificationDelivery },
        });
      } else {
        navigate('/verify-account', {
          state: { verificationDelivery: data?.verificationDelivery },
        });
      }
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Registration failed. Please check your details.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      wide
      title="Create your Her Skill account"
      subtitle="Join a trusted community built exclusively for women."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <p className="mb-2.5 text-sm font-semibold text-[#5a3e57]">
            Choose your account type <span className="text-[#a45d81]">*</span>
          </p>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, accountType: 'buyer' }))}
              className={`relative flex flex-col rounded-2xl border p-5 text-left transition cursor-pointer ${
                form.accountType === 'buyer'
                  ? 'border-[#a45d81] bg-[#f8e5ed]/55 ring-2 ring-[#a45d81]/20'
                  : 'border-[#eadfdb] bg-white hover:bg-[#fffaf7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8e5ed] text-[#a45d81]">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                {form.accountType === 'buyer' && (
                  <CheckCircle2 className="h-5 w-5 text-[#a45d81]" />
                )}
              </div>
              <h3 className="mt-3.5 font-display text-lg font-bold text-[#5a3e57]">
                Buyer Account
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#786b75]">
                Discover handmade crafts and hire verified skilled women. You can
                activate Seller mode later on the same account.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, accountType: 'seller' }))}
              className={`relative flex flex-col rounded-2xl border p-5 text-left transition cursor-pointer ${
                form.accountType === 'seller'
                  ? 'border-[#a45d81] bg-[#f4e9cb]/55 ring-2 ring-[#a45d81]/20'
                  : 'border-[#eadfdb] bg-white hover:bg-[#fffaf7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4e9cb] text-[#817c31]">
                  <Store className="h-5 w-5" />
                </span>
                {form.accountType === 'seller' && (
                  <CheckCircle2 className="h-5 w-5 text-[#a45d81]" />
                )}
              </div>
              <h3 className="mt-3.5 font-display text-lg font-bold text-[#5a3e57]">
                Seller Account
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#786b75]">
                Showcase your crafts or services. Includes identity verification
                before publishing listings, plus full buyer access.
              </p>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            name="name"
            type="text"
            icon={User}
            placeholder="Amina Tariq"
            value={form.name}
            onChange={handleChange}
            error={fieldErrors.name}
            required
          />

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            icon={Phone}
            placeholder="+923001234567"
            value={form.phone}
            onChange={handleChange}
            error={fieldErrors.phone}
            required
          />
        </div>

        <Input
          label="Email Address"
          name="email"
          type="email"
          icon={Mail}
          placeholder="amina@example.com"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password"
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
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            required
          />
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {form.accountType === 'seller'
            ? 'Create Account & Continue to Seller Verification'
            : 'Create Buyer Account'}
        </Button>

        <p className="border-t border-[#eee1dc] pt-4 text-center text-sm text-[#786b75]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#a45d81] hover:text-[#5a3e57] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
