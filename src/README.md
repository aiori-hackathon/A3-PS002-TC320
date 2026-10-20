# FitTrack Lite — Purpose-Based Consent Recording & Withdrawal Prototype

**AIORI-3 Problem Statement:** A3-PS002-TC320  
**Prototype Title:** FitTrack Lite Purpose-Based Consent Management  
**Author / Team:** Anupam Raj (`anupam.raj.csbs28@heritageit.edu.in`)  
**Regulatory Alignment:** Digital Personal Data Protection (DPDP) Act 2023 (India), GDPR (Articles 6 & 7), ISO/IEC 29184:2020, Kantara Consent Receipts v1.1, RFC 8785 JSON Canonicalization Scheme (JCS).

---

## 1. Executive Summary

In conventional systems, user consent is frequently captured as a single bundled database flag that downstream services rarely check at the instant of data sharing. Furthermore, historical consent records often fail to record the specific privacy notice version the user saw, and withdrawal is either batched or ignored.

**FitTrack Lite** solves these fundamental gaps with a reference implementation of a purpose-based consent architecture:
1. **Unbundled Itemized Consent:** Disaggregated controls for synthetic purposes (`fitness_analytics`, `personalized_recommendations`, `marketing`, `research_sharing`).
2. **Immediate Server-Side Enforcement:** Downstream mock data-sharing endpoints check live consent state at request time. Withdrawal takes effect immediately.
3. **Notice Versioning & Staleness Invalidation:** Each notice version is hashed using SHA-256. When an administrator publishes an updated notice, older consents automatically become `CONSENT_STALE` until explicit re-consent is granted.
4. **Append-Only Event Store:** Every grant and withdrawal creates a new immutable event. Historical records are never modified.
5. **Tamper-Evident Hash Chain:** All consent operations and data access decisions are recorded in a sequentially linked SHA-256 hash chain with cryptographic verification and JSON/CSV export.

---

## 2. Architecture & Design

### System Architecture
```
+-------------------------------------------------------------------------------+
|                             FitTrack Lite System                              |
|                                                                               |
|  [ Synthetic User ]                                     [ Mock Consumer ]     |
|          |                                                      |             |
|          v                                                      v             |
|  +--------------------+                             +----------------------+  |
|  |  Consent Dashboard |                             |   Data-Sharing API   |  |
|  |     (React UI)     |                             |   (/api/data/access) |  |
|  +---------+----------+                             +-----------+----------+  |
|            |                                                    |             |
|            v                                                    v             |
|  +--------------------+     +-----------------+     +----------------------+  |
|  |   Consent Service  | <-> | Notice Registry | <-> |  Enforcement Layer   |  |
|  | (Grant / Withdraw) |     | (Version & Hash)|     | (Live Consent Check) |  |
|  +---------+----------+     +--------+--------+     +-----------+----------+  |
|            |                         |                          |             |
|            +------------+            |            +-------------+             |
|                         v            v            v                           |
|                       +------------------------------+                        |
|                       |        Audit Service         |                        |
|                       |    (Hash Chain & Export)     |                        |
|                       +--------------+---------------+                        |
|                                      |                                        |
|                                      v                                        |
|                       +------------------------------+                        |
|                       |         SQLite Store         |                        |
|                       | users, purposes, notices,    |                        |
|                       | consent_events, audit_events |                        |
|                       +------------------------------+                        |
+-------------------------------------------------------------------------------+
```

### Data Flow
1. **Record Consent:** Synthetic user grants or withdraws consent for an itemized purpose under active Notice v1.0. An append-only `ConsentEvent` is saved and logged to the audit hash chain.
2. **Check & Serve:** Downstream consumer requests data via `POST /api/data/access`. The enforcement layer evaluates user status, purpose status, latest consent event, and notice hash match. If authorized, returns HTTP 200 with synthetic metrics. If unauthorized, returns HTTP 403 with zero protected data.
3. **Audit & Verify:** Every decision (allowed or denied) is linked into the hash chain (`prev_hash:payload_hash -> current_hash`). The verification endpoint recalculates every link and detects any record tampering.

---

## 3. Directory Layout

The codebase strictly follows the required hackathon project layout inside `src/`:

```
src/
├── README.md                   # Application documentation
├── backend/
│   ├── app/
│   │   ├── api/                # API router endpoints
│   │   │   ├── admin.py        # Notice publishing & tampering demo
│   │   │   ├── audit.py        # Audit events, verification & exports
│   │   │   ├── consent.py      # Consent state, grant & withdrawal
│   │   │   ├── data.py         # Mock data access simulation
│   │   │   ├── health.py       # Health check endpoint
│   │   │   ├── notices.py      # Notice registry & current notice
│   │   │   ├── purposes.py     # Purpose registry
│   │   │   └── users.py        # User directory
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic environment configuration
│   │   │   ├── hash_chain.py   # Canonical JSON (RFC 8785) & SHA-256 chaining
│   │   │   └── security.py     # Administrative authorization (X-Admin-Key)
│   │   ├── db/
│   │   │   ├── init_db.py      # Database table initialization & seeding
│   │   │   └── session.py     # SQLAlchemy engine & session factory
│   │   ├── models/             # SQLAlchemy ORM database models
│   │   │   ├── audit_event.py  # Hash-chained immutable audit log
│   │   │   ├── consent_event.py# Append-only consent event ledger
│   │   │   ├── notice.py       # Privacy notice versions & SHA-256 hashes
│   │   │   ├── purpose.py      # Itemized purpose definitions
│   │   │   └── user.py         # Synthetic users
│   │   ├── schemas/            # Pydantic schemas for request/response validation
│   │   │   ├── audit.py
│   │   │   ├── consent.py
│   │   │   ├── data_access.py
│   │   │   ├── notice.py
│   │   │   ├── purpose.py
│   │   │   └── user.py
│   │   ├── services/           # Decoupled business logic services
│   │   │   ├── audit_service.py        # Thread-safe hash chain logging & verification
│   │   │   ├── authorization_service.py# Authoritative live consent evaluation
│   │   │   ├── consent_service.py      # Append-only consent state manager
│   │   │   ├── data_service.py         # Downstream mock synthetic telemetry generator
│   │   │   └── notice_service.py       # Notice publication & hash calculator
│   │   └── main.py             # FastAPI entrypoint, CORS, global exception handler
│   ├── tests/
│   │   ├── conftest.py         # Pytest fixtures, in-memory DB isolation
│   │   └── test_consent_flow.py# 15 automated lifecycle & enforcement tests
│   ├── requirements.txt        # Backend dependencies
│   └── .env.example            # Backend environment template
└── frontend/
    ├── src/
    │   ├── components/         # Navbar, StatusBadge, UI components
    │   ├── pages/              # Overview, Consent, Simulator, Notices, Audit
    │   ├── services/           # Typed API client wrapper
    │   ├── types/              # TypeScript interfaces
    │   ├── App.tsx             # Application root layout & tab routing
    │   ├── main.tsx            # React DOM mounting
    │   └── index.css           # Tailwind styling
    ├── package.json            # Frontend dependencies & scripts
    ├── vite.config.ts          # Vite build & API proxy setup
    ├── tailwind.config.js      # Tailwind configuration
    ├── tsconfig.json           # Strict TypeScript configuration
    └── .env.example            # Frontend environment template
```

---

## 4. Reason Codes & Authorization Rules

The server-side authorization engine validates every data-sharing request against these strict checks:

| Priority | Check | Reason Code | HTTP Status | Description |
| :---: | :--- | :--- | :---: | :--- |
| **1** | User exists | `UNKNOWN_USER` | `403 Forbidden` | User identifier does not exist in registry |
| **2** | User is active | `INACTIVE_USER` | `403 Forbidden` | User account has been deactivated |
| **3** | Purpose exists | `UNKNOWN_PURPOSE` | `403 Forbidden` | Processing purpose is unrecognized |
| **4** | Purpose is active | `INACTIVE_PURPOSE` | `403 Forbidden` | Purpose has been archived or deprecated |
| **5** | Consent record exists | `NO_CONSENT` | `403 Forbidden` | User has never granted consent for this purpose |
| **6** | Latest action | `CONSENT_WITHDRAWN` | `403 Forbidden` | Most recent user action was withdrawal |
| **7** | Notice hash match | `CONSENT_STALE` | `403 Forbidden` | Notice terms updated; re-consent required |
| **8** | All checks pass | `CONSENT_ACTIVE` | `200 OK` | Active informed consent verified under current notice |

---

## 5. API Reference

### Health & Metadata
- `GET /api/health` — Service health and metadata
- `GET /api/users` — List synthetic users (`user_001` to `user_005`, plus inactive)
- `GET /api/purposes` — List itemized purposes

### Consent Management
- `GET /api/consent/state?user_id={id}` — Current derived consent state for all purposes
- `POST /api/consent/grant` — Record append-only grant under active notice
- `POST /api/consent/withdraw` — Record append-only withdrawal
- `GET /api/consent/history?user_id={id}` — Complete append-only event stream

### Data Sharing Simulation
- `POST /api/data/access` — Mock data consumer access request
  ```json
  { "user_id": "user_001", "purpose": "fitness_analytics" }
  ```
  Returns HTTP 200 with synthetic metrics if authorized; HTTP 403 with reason code if denied.

### Privacy Notice Registry
- `GET /api/notices/current` — Current active notice version and SHA-256 hash
- `GET /api/notices` — Complete version history
- `POST /api/notices` — Administrator endpoint to publish a new notice version (requires `X-Admin-Key: fittrack_admin_secret_key_change_in_prod`)

### Audit Trail & Verification
- `GET /api/audit/events` — Chronological hash-chained audit log
- `GET /api/audit/verify` — Cryptographic hash chain validation
- `GET /api/audit/export?format=json` — Download audit evidence as JSON
- `GET /api/audit/export?format=csv` — Download audit evidence as CSV
- `POST /api/admin/tamper-test` — Demonstration endpoint to test tamper detection

---

## 6. Setup & Execution Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm 9+

### Backend Setup
```bash
# Navigate to backend directory
cd src/backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server (runs on port 8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend automatically creates and seeds `fittrack_consent.db` with 5 demo users, 4 purposes, Notice v1.0, and the initial audit record.

### Frontend Setup
```bash
# Navigate to frontend directory
cd src/frontend

# Install dependencies
npm install

# Start Vite dev server (runs on port 5173 with proxy to backend)
npm run dev

# Or build production assets
npm run build
```

Open your browser at **`http://localhost:5173`** to interact with the full dashboard.

---

## 7. Running Automated Tests

A dedicated test suite of **15 automated tests** verifies all functional and engineering requirements using a temporary in-memory SQLite database:

```bash
# From workspace root:
PYTHONPATH=src/backend src/backend/.venv/bin/pytest src/backend/tests/ -v
```

### Verified Test Suite:
1. `test_health_check` — Verifies service status.
2. `test_seed_data_loaded` — Verifies users, purposes, and Notice v1.0 hash.
3. `test_missing_consent_denies_access` — Missing consent returns HTTP 403 (`NO_CONSENT`).
4. `test_matching_active_consent_allows_access` — Grant creates event and returns HTTP 200 with telemetry.
5. `test_withdrawal_blocks_next_request` — Critical workflow: Grant (200) &rarr; Withdraw &rarr; Deny (403 `CONSENT_WITHDRAWN`).
6. `test_purpose_mismatch_denial` — Consent for Purpose A cannot be reused for Purpose B.
7. `test_unknown_user_and_unknown_purpose_denial` — Invalid identifiers return 403 (`UNKNOWN_USER`, `UNKNOWN_PURPOSE`).
8. `test_inactive_user_and_purpose_denial` — Deactivated entities return 403 (`INACTIVE_USER`, `INACTIVE_PURPOSE`).
9. `test_notice_change_stale_consent_and_reconsent` — Notice update makes prior consent `CONSENT_STALE`; re-consent under v2.0 restores access.
10. `test_append_only_consent_history` — Multiple actions are preserved in full; events are never overwritten.
11. `test_audit_logging_and_verification` — All operations are logged and hash chain passes verification.
12. `test_audit_tamper_detection` — Manipulating record payload causes verification to fail and pinpoint the sequence number.
13. `test_audit_broken_hash_link_detection` — Corrupting hash links causes verification to fail.
14. `test_audit_export_json_and_csv` — Verifies JSON and CSV audit export streams.
15. `test_admin_authorization_enforced` — Admin publishing requires valid `X-Admin-Key`.

---

## 8. Interactive Demonstration Walkthrough

To demonstrate the system in the web interface or via API:

### Step 1: Baseline Check (No Consent)
1. Go to **Data Access Simulator** tab.
2. Select `Alex Morgan (user_001)` and `Fitness Analytics & Metrics (fitness_analytics)`.
3. Click **Send Access Request**.
4. Observe **HTTP 403 Forbidden** with reason code **`NO_CONSENT`** and zero protected data.

### Step 2: Grant Consent
1. Switch to **Consent Dashboard** tab.
2. Under `Fitness Analytics & Metrics`, click **Grant Consent**.
3. Status badge updates to **Active Consent** bound to Notice v1.0.

### Step 3: Request Protected Data (Allowed)
1. Switch back to **Data Access Simulator**.
2. Click **Send Access Request**.
3. Observe **HTTP 200 OK** with reason code **`CONSENT_ACTIVE`** and synthetic telemetry (steps, calories, heart rate).

### Step 4: Immediate Withdrawal Enforcement
1. Switch to **Consent Dashboard**.
2. Click **Withdraw Consent**.
3. Return to **Data Access Simulator** and repeat the exact same request.
4. Observe **HTTP 403 Forbidden** with reason code **`CONSENT_WITHDRAWN`**. Data access is blocked immediately without delay.

### Step 5: Notice Reversion & Staleness
1. Switch to **Notice Management** tab.
2. Publish Notice **`v2.0`** using the admin form.
3. Switch back to **Consent Dashboard**: all prior consents now display **`STALE (Re-consent Required)`**.
4. Any data request will return **HTTP 403 `CONSENT_STALE`** until the user reviews and clicks **Review & Re-consent (v2.0)**.

### Step 6: Audit Chain Integrity & Tamper Detection
1. Switch to **Audit & Evidence Trail** tab.
2. Observe every grant, withdrawal, and data request recorded in order (`#1`, `#2`, `#3`...).
3. Click **Re-Verify Chain Now** &rarr; displays **CHAIN VERIFIED INTACT**.
4. Click **Tamper Record Payload** &rarr; an attacker modifies a record directly in storage.
5. Click **Re-Verify Chain Now** &rarr; verification immediately catches the altered payload and flags **INTEGRITY BREACH DETECTED** at the exact sequence number!
6. Click **Export JSON** or **Export CSV** to download verifiable audit evidence.

---

## 9. Engineering Notes & Prototype Limitations

- **Authentication Limitation:** This prototype accepts `user_id` in request payloads to simulate synthetic data principals and test authorization logic across diverse users. In production, `user_id` must be extracted strictly from authenticated JWT session tokens.
- **Tamper Evidence vs. Tamper Proofing:** Hash chains provide cryptographic **tamper evidence** (any modification breaks the cryptographic link and is immediately detectable). They do not prevent a root database administrator with write access from deleting data, but ensure that any alteration cannot be concealed.
- **Deterministic Serialization:** In compliance with RFC 8785 (JCS), all audit payload hashes use lexicographically sorted keys and compact separators to ensure cross-platform reproducibility.
