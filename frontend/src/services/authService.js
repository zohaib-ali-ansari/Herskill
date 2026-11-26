import api from './api';

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function loginAdmin(payload) {
  const { data } = await api.post('/auth/admin/login', payload);
  return data;
}

export async function logoutUser() {
  const { data } = await api.post('/auth/logout');
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function verifyContactCode(payload) {
  const { data } = await api.post('/auth/verify-contact', payload);
  return data;
}

export async function resendVerificationCode() {
  const { data } = await api.post('/auth/resend-verification');
  return data;
}

export async function requestPasswordReset(payload) {
  const { data } = await api.post('/auth/forgot-password', payload);
  return data;
}

export async function resetPasswordWithToken(payload) {
  const { data } = await api.post('/auth/reset-password', payload);
  return data;
}

export async function switchAccountMode(mode) {
  const { data } = await api.patch('/auth/switch-mode', { mode });
  return data;
}

export async function updateAccountProfile(payload) {
  const { data } = await api.patch('/auth/profile', payload);
  return data;
}

export async function changeAccountPassword(payload) {
  const { data } = await api.patch('/auth/change-password', payload);
  return data;
}
