import hashlib
import json
from typing import Any, Dict

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def canonical_json_bytes(data: Any) -> bytes:
    """Produces deterministic canonical UTF-8 JSON bytes (RFC 8785 inspired)."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def compute_sha256(data_bytes: bytes) -> str:
    """Computes hexadecimal SHA-256 hash of bytes."""
    return hashlib.sha256(data_bytes).hexdigest()


def compute_notice_hash(version: str, title: str, content: str) -> str:
    """Computes deterministic SHA-256 hash of a privacy notice version."""
    payload = {
        "version": version.strip(),
        "title": title.strip(),
        "content": content.strip(),
    }
    return compute_sha256(canonical_json_bytes(payload))


def compute_audit_payload_hash(payload: Dict[str, Any]) -> str:
    """Computes deterministic SHA-256 hash of the audit entry's payload."""
    return compute_sha256(canonical_json_bytes(payload))


def compute_chained_hash(prev_hash: str, payload_hash: str) -> str:
    """Computes the current record's hash by chaining prev_hash and payload_hash."""
    combined = f"{prev_hash}:{payload_hash}".encode("utf-8")
    return compute_sha256(combined)
