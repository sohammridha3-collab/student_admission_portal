const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('admission_portal_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = (data && data.error) || (data && data.message) || response.statusText || 'Request failed';
    throw new Error(errorMessage);
  }
  return data;
}

export const api = {
  // Authentication
  async register(payload) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async login(payload) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async forgotPassword(payload) {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async resetPassword(payload) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Student Endpoints
  async getStudentApplication() {
    const res = await fetch(`${API_BASE_URL}/student/application`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async saveStudentForm(payload) {
    const res = await fetch(`${API_BASE_URL}/student/fill-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async uploadStudentDocument(formData) {
    const res = await fetch(`${API_BASE_URL}/student/upload-document`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },

  async deleteStudentDocument(docId) {
    const res = await fetch(`${API_BASE_URL}/student/document/${docId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async payApplicationFee(payload) {
    const res = await fetch(`${API_BASE_URL}/student/pay-fee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async submitApplication() {
    const res = await fetch(`${API_BASE_URL}/student/submit-application`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Admission Officer Endpoints
  async getOfficerQueue(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/officer/applications?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getOfficerApplicationDetail(appId) {
    const res = await fetch(`${API_BASE_URL}/officer/applications/${appId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async verifyDocument(docId, payload) {
    const res = await fetch(`${API_BASE_URL}/officer/documents/${docId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async recordEntranceTest(appId, payload) {
    const res = await fetch(`${API_BASE_URL}/officer/applications/${appId}/entrance-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async makeDecision(appId, payload) {
    const res = await fetch(`${API_BASE_URL}/officer/applications/${appId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getOfficerReports(format = 'json') {
    const res = await fetch(`${API_BASE_URL}/officer/reports?format=${format}`, {
      headers: { ...getAuthHeader() }
    });
    if (format === 'csv') {
      return res.text();
    }
    return handleResponse(res);
  },

  // Admin Endpoints
  async getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/admin/users?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createAdminUser(payload) {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async updateAdminUser(userId, payload) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async toggleUserStatus(userId) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async resetUserPassword(userId, newPassword) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ newPassword })
    });
    return handleResponse(res);
  },

  async updatePermissions(userId, payload) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getSystemPolicy() {
    const res = await fetch(`${API_BASE_URL}/admin/policy`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateSystemPolicy(payload) {
    const res = await fetch(`${API_BASE_URL}/admin/policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/admin/audit-logs?${query}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAdminReports() {
    const res = await fetch(`${API_BASE_URL}/admin/reports`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};
