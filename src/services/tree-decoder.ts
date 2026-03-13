/**
 * Decode a PoB / GGG passive skill tree URL to extract allocated node IDs.
 *
 * URL format:
 *   https://www.pathofexile.com/passive-skill-tree/VERSION/BASE64URL
 *   https://www.pathofexile.com/passive-skill-tree/BASE64URL
 *
 * Binary layout (version ≥ 4):
 *   [0-3]  uint32 BE  – format version (typically 4–6)
 *   [4]    uint8      – character class  (0-6)
 *   [5]    uint8      – ascendancy class (0-3)
 *   [6]    uint8      – fullscreen flag  (version ≥ 6 only, 0 or 1)
 *   [7+]   uint16 BE  – allocated node IDs (skill hashes)
 */

export interface DecodedTree {
  version: number;
  classId: number;
  ascendancyId: number;
  allocatedNodes: Set<number>;
}

function base64UrlToBytes(encoded: string): Uint8Array {
  let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");

  while (b64.length % 4 !== 0) {
    b64 += "=";
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

/** Try to extract the base64-encoded tree data from a URL or raw string. */
function extractEncodedData(input: string): string | null {
  // Case 1: Full GGG URL — extract last path segment after /passive-skill-tree/
  const marker = "/passive-skill-tree/";
  const idx = input.indexOf(marker);
  if (idx >= 0) {
    const rest = input.slice(idx + marker.length);
    const segments = rest.split("/").filter(Boolean);
    return segments[segments.length - 1] || null;
  }

  // Case 2: Raw base64url data (no URL prefix) — validate it looks like base64
  const trimmed = input.trim();
  if (trimmed.length > 10 && /^[A-Za-z0-9_\-+/=]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function decodeTreeUrl(url: string): DecodedTree | null {
  try {
    const encoded = extractEncodedData(url);
    if (!encoded) return null;

    const bytes = base64UrlToBytes(encoded);
    if (bytes.length < 7) return null;

    const view = new DataView(bytes.buffer);
    const version = view.getUint32(0, false);
    const classId = bytes[4];
    const ascendancyId = bytes[5];

    // Version 6+ has a fullscreen byte at offset 6
    const nodeStart = version >= 6 ? 7 : 6;

    const allocatedNodes = new Set<number>();

    for (let i = nodeStart; i + 1 < bytes.length; i += 2) {
      const nodeId = view.getUint16(i, false);

      if (nodeId > 0) {
        allocatedNodes.add(nodeId);
      }
    }

    return { version, classId, ascendancyId, allocatedNodes };
  } catch (err) {
    console.error("[TreeDecoder] decode error:", err);
    return null;
  }
}
