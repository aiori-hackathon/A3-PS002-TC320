export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Purpose {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface PrivacyNotice {
  id: number;
  version: string;
  title: string;
  content: string;
  hash_sha256: string;
  is_current: boolean;
  created_at: string;
}

export interface ConsentState {
  purpose_id: string;
  purpose_name: string;
  purpose_description: string;
  status: 'GRANTED' | 'WITHDRAWN' | 'NO_CONSENT';
  is_stale: boolean;
  notice_version: string | null;
  notice_hash: string | null;
  last_updated: string | null;
}

export interface UserConsentSummary {
  user_id: string;
  current_notice_version: string;
  current_notice_hash: string;
  states: ConsentState[];
}

export interface ConsentEvent {
  id: number;
  event_id: string;
  user_id: string;
  purpose_id: string;
  action: 'GRANT' | 'WITHDRAW';
  notice_version: string;
  notice_hash: string;
  timestamp: string;
  metadata_json?: string;
}

export interface DataAccessResponse {
  status: 'ALLOWED';
  reason_code: string;
  user_id: string;
  purpose: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface DataAccessDeniedDetail {
  status: 'DENIED';
  reason_code: string;
  message: string;
  user_id: string;
  purpose: string;
}

export interface AuditEvent {
  sequence_number: number;
  event_id: string;
  timestamp: string;
  event_type: string;
  user_id: string | null;
  purpose_id: string | null;
  decision: 'ALLOW' | 'DENY' | 'RECORDED';
  reason_code: string;
  payload_json: string;
  payload_hash: string;
  prev_hash: string;
  current_hash: string;
}

export interface AuditVerifyResponse {
  is_valid: boolean;
  total_records: number;
  latest_hash: string | null;
  verified_at: string;
  broken_at_sequence?: number | null;
  error_message?: string | null;
}
