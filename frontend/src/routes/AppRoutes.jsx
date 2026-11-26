import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';

import HomePage from '../pages/marketplace/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyAccountPage from '../pages/auth/VerifyAccountPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

import BuyerDashboardPage from '../pages/customer/BuyerDashboardPage';

import ActivateSellerPage from '../pages/seller/ActivateSellerPage';
import SellerVerificationIntroPage from '../pages/seller/SellerVerificationIntroPage';
import SellerVerificationFormPage from '../pages/seller/SellerVerificationFormPage';
import VerificationPendingPage from '../pages/seller/VerificationPendingPage';
import VerificationStatusPage from '../pages/seller/VerificationStatusPage';
import SellerDashboardPage from '../pages/seller/SellerDashboardPage';

import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminVerificationsPage from '../pages/admin/AdminVerificationsPage';
import AdminVerificationDetailPage from '../pages/admin/AdminVerificationDetailPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Authenticated Account Verification */}
      <Route
        path="/verify-account"
        element={
          <ProtectedRoute allowedRoles={['buyer', 'seller']}>
            <VerifyAccountPage />
          </ProtectedRoute>
        }
      />

      {/* Buyer Routes */}
      <Route
        path="/buyer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['buyer', 'seller']}>
            <BuyerDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Seller Onboarding & Verification Routes */}
      <Route
        path="/seller/activate"
        element={
          <ProtectedRoute allowedRoles={['buyer', 'seller']}>
            <ActivateSellerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/verification/intro"
        element={
          <ProtectedRoute allowedRoles={['buyer', 'seller']}>
            <SellerVerificationIntroPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/verification/apply"
        element={
          <ProtectedRoute allowedRoles={['seller']}>
            <SellerVerificationFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/verification/pending"
        element={
          <ProtectedRoute allowedRoles={['seller']}>
            <VerificationPendingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/verification/status"
        element={
          <ProtectedRoute allowedRoles={['seller']}>
            <VerificationStatusPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/dashboard"
        element={
          <ProtectedRoute allowedRoles={['seller']}>
            <SellerDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verifications"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVerificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verifications/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVerificationDetailPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
