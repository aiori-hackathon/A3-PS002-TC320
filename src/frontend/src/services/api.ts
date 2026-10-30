import {
  User,
  Purpose,
  PrivacyNotice,
  UserConsentSummary,
  ConsentEvent,
  AuditEvent,
  AuditVerifyResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const body = await res.json();
      if (body.detail) {
        if (typeof body.detail === 'object') {
          errorDetail = body.detail.message || JSON.stringify(body.detail);
        } else {
          errorDetail = body.detail;
        }
      }
    } catch {
      errorDetail = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Users & Purposes
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/api/users`);
    return handleResponse<User[]>(res);
  },

  async getPurposes(): Promise<Purpose[]> {
    const res = await fetch(`${API_BASE}/api/purposes`);
    return handleResponse<Purpose[]>(res);
  },

  // Privacy Notices
  async getCurrentNotice(): Promise<PrivacyNotice> {
    const res = await fetch(`${API_BASE}/api/notices/current`);
    return handleResponse<PrivacyNotice>(res);
  },

  async getNotices(): Promise<PrivacyNotice[]> {
    const res = await fetch(`${API_BASE}/api/notices`);
    return handleResponse<PrivacyNotice[]>(res);
  },

  async publishNotice(
    version: string,
    title: string,
    content: string,
    adminKey: string
  ): Promise<PrivacyNotice> {
    const res = await fetch(`${API_BASE}/api/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify({ version, title, content }),
    });
    return handleResponse<PrivacyNotice>(res);
  },

  // Consent Operations
  async getUserConsentState(userId: string): Promise<UserConsentSummary> {
    const res = await fetch(`${API_BASE}/api/consent/state?user_id=${encodeURIComponent(userId)}`);
    return handleResponse<UserConsentSummary>(res);
  },

  async grantConsent(userId: string, purposeId: string): Promise<ConsentEvent> {
    const res = await fetch(`${API_BASE}/api/consent/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, purpose_id: purposeId }),
    });
    return handleResponse<ConsentEvent>(res);
  },

  async withdrawConsent(userId: string, purposeId: string): Promise<ConsentEvent> {
    const res = await fetch(`${API_BASE}/api/consent/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, purpose_id: purposeId }),
    });
    return handleResponse<ConsentEvent>(res);
  },

  async getUserConsentHistory(userId: string): Promise<ConsentEvent[]> {
    const res = await fetch(
      `${API_BASE}/api/consent/history?user_id=${encodeURIComponent(userId)}&limit=50`
    );
    return handleResponse<ConsentEvent[]>(res);
  },

  // Mock Data Sharing API
  async requestDataAccess(
    userId: string,
    purpose: string
  ): Promise<{ status: number; body: any }> {
    const res = await fetch(`${API_BASE}/api/data/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, purpose }),
    });
    const status = res.status;
    const body = await res.json();
    return { status, body };
  },

  // Audit Log & Verification
  async getAuditEvents(limit = 100, offset = 0): Promise<AuditEvent[]> {
    const res = await fetch(`${API_BASE}/api/audit/events?limit=${limit}&offset=${offset}`);
    return handleResponse<AuditEvent[]>(res);
  },

  async verifyAuditChain(): Promise<AuditVerifyResponse> {
    const res = await fetch(`${API_BASE}/api/audit/verify`);
    return handleResponse<AuditVerifyResponse>(res);
  },

  async simulateTampering(
    tamperType: 'payload' | 'hash_link',
    adminKey: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/tamper-test?tamper_type=${tamperType}`, {
      method: 'POST',
      headers: { 'X-Admin-Key': adminKey },
    });
    return handleResponse<any>(res);
  },

  getExportUrl(format: 'json' | 'csv'): string {
    return `${API_BASE}/api/audit/export?format=${format}`;
  },
};
