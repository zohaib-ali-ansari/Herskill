import api from './api';

export async function fetchAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data;
}

export async function fetchAdminVerifications(params = {}) {
  const { data } = await api.get('/admin/verifications', { params });
  return data;
}

export async function fetchAdminVerificationDetail(id) {
  const { data } = await api.get(`/admin/verifications/${id}`);
  return data;
}

export async function approveSellerVerification(id) {
  const { data } = await api.patch(`/admin/verifications/${id}/approve`);
  return data;
}

export async function rejectSellerVerification(id, rejectionReason) {
  const { data } = await api.patch(`/admin/verifications/${id}/reject`, {
    rejectionReason,
  });
  return data;
}

/**
 * Downloads a protected document/image using the admin Bearer token and returns an object URL.
 */
export async function fetchProtectedFileBlobUrl(endpoint) {
  const relativePath = endpoint.startsWith('/api/')
    ? endpoint.slice(4)
    : endpoint;
  const response = await api.get(relativePath, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(response.data);
  return {
    blobUrl,
    mimeType: response.data.type || response.headers['content-type'] || '',
  };
}
