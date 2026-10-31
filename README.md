# FitTrack Lite — Purpose-Based Consent Management

> **AIORI-3 Hackathon Submission**  
> Problem Statement: **A3-PS002-TC320**  
> Team Introduction Video: [YouTube](https://youtu.be/sMHmEqIcPks)
> Demonstration Video: [YouTube](https://youtu.be/c3JlPYbr-98)

---

## Overview

**FitTrack Lite** is a reference implementation of a **purpose-based explicit consent recording and withdrawal system** for a fitness analytics platform.

Built strictly to India's **DPDP Act 2023**, **GDPR Articles 6 & 7**, **ISO/IEC 29184:2020**, **Kantara Consent Receipts v1.1**, and **RFC 8785** (JSON Canonicalization Scheme), FitTrack Lite demonstrates how real-world consent management should be architected — not just stored as a database flag.

---

## Key Features

| Feature | Implementation |
|---|---|
| **Unbundled Itemized Consent** | Per-purpose grant/withdrawal for `fitness_analytics`, `personalized_recommendations`, `marketing`, `research_sharing` |
| **Immediate Enforcement** | Server-side authorization checks live consent at every data request — no stale cache |
| **Notice Versioning** | SHA-256 hashed privacy notices; prior consents auto-invalidate when a new notice is published |
| **Append-Only Ledger** | Every consent event is immutable; history is never overwritten |
| **Tamper-Evident Audit Chain** | All operations linked by a sequential SHA-256 hash chain (RFC 8785); verification detects any modification |
| **Cryptographic Export** | Audit evidence downloadable as JSON or CSV |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, SQLite, Pydantic v2 |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Hashing** | SHA-256 via `hashlib`, RFC 8785 canonical JSON serialization |
| **Testing** | Pytest — 15 automated lifecycle & enforcement tests |

---

## Architecture

```
[ Synthetic User ]                          [ Mock Consumer ]
       |                                           |
       v                                           v
+--------------------+              +----------------------+
|  Consent Dashboard |              |   Data-Sharing API   |
|     (React UI)     |              |   /api/data/access   |
+--------+-----------+              +-----------+----------+
         |                                      |
         v                                      v
+--------------------+   +-----------------+   +----------------------+
|   Consent Service  |<->| Notice Registry |<->|  Enforcement Layer   |
| (Grant / Withdraw) |   | (Version & Hash)|   | (Live Consent Check) |
+--------+-----------+   +--------+--------+   +-----------+----------+
         |                        |                         |
         +------------+-----------+-------------+-----------+
                      v                         v
              +------------------------------+
              |        Audit Service         |
              |    (Hash Chain & Export)     |
              +--------------+---------------+
                             |
                             v
              +------------------------------+
              |         SQLite Store         |
              | users, purposes, notices,    |
              | consent_events, audit_events |
              +------------------------------+
```

---

## Authorization Rules

The enforcement engine validates every data-sharing request in strict priority order:

| # | Check | Reason Code | HTTP |
|:---:|---|---|:---:|
| 1 | User exists | `UNKNOWN_USER` | `403` |
| 2 | User is active | `INACTIVE_USER` | `403` |
| 3 | Purpose exists | `UNKNOWN_PURPOSE` | `403` |
| 4 | Purpose is active | `INACTIVE_PURPOSE` | `403` |
| 5 | Consent record exists | `NO_CONSENT` | `403` |
| 6 | Latest action is a grant | `CONSENT_WITHDRAWN` | `403` |
| 7 | Notice hash matches | `CONSENT_STALE` | `403` |
| 8 | All checks pass | `CONSENT_ACTIVE` | `200` |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm 9+

### 1. Backend

```bash
cd src/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend auto-creates and seeds `fittrack_consent.db` with 5 demo users, 4 purposes, Notice v1.0, and the genesis audit record.

### 2. Frontend

```bash
cd src/frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Running Tests

```bash
# From the repo root
PYTHONPATH=src/backend src/backend/.venv/bin/pytest src/backend/tests/ -v
```

**15 automated tests** covering the complete consent lifecycle, enforcement rules, notice staleness invalidation, append-only history, hash chain verification, tamper detection, and audit export.

---

## Project Structure

```
src/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── core/         # Hash chain (RFC 8785) & config
│   │   ├── db/           # SQLAlchemy engine & seed data
│   │   ├── models/       # ORM models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   └── services/     # Business logic (consent, audit, enforcement)
│   ├── tests/            # 15 pytest lifecycle & enforcement tests
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/   # Sidebar, layout components
        ├── pages/        # Overview, Consent, Simulator, Notices, Audit
        ├── services/     # Typed API client
        └── types/        # TypeScript interfaces
```

For full API reference and demo walkthrough, see [`src/README.md`](src/README.md).

---

## Regulatory Alignment

- 🇮🇳 **DPDP Act 2023** — Section 6 (purpose limitation, explicit consent), Section 11 (right to withdraw)
- 🇪🇺 **GDPR** — Articles 6 & 7 (lawful basis, freely given consent)
- 📋 **ISO/IEC 29184:2020** — Online privacy notices and consent
- 🔗 **Kantara Consent Receipts v1.1** — Interoperable consent record structure
- 🔐 **RFC 8785 JCS** — Deterministic canonical JSON for cross-platform hash reproducibility

---

## Team

**Anupam Raj**  
`anupam.raj.csbs28@heritageit.edu.in`  
AIORI-3 Hackathon · Problem Statement A3-PS002-TC320
