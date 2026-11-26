import api from './api';

export async function activateSellerAccount() {
  const { data } = await api.post('/seller/activate');
  return data;
}

export async function fetchSellerProfile() {
  const { data } = await api.get('/seller/profile');
  return data;
}

export async function updateSellerProfile(payload) {
  const { data } = await api.patch('/seller/profile', payload);
  return data;
}

export async function fetchVerificationStatus() {
  const { data } = await api.get('/seller/verification-status');
  return data;
}

export async function submitSellerVerification(formData) {
  const { data } = await api.post('/seller/verification', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function resubmitSellerVerification(formData) {
  const { data } = await api.put('/seller/verification/resubmit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function checkSellerPublishPermission() {
  const { data } = await api.post('/seller/publish-check');
  return data;
}
