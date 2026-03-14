/**
 * Decode a PoB / GGG passive skill tree URL to extract allocated node IDs
 * and mastery effect selections.
 *
 * URL format:
 *   https://www.pathofexile.com/passive-skill-tree/VERSION/BASE64URL
 *   https://www.pathofexile.com/passive-skill-tree/BASE64URL
 *
 * Binary layout (version ≥ 6):
 *   [0-3]  uint32 BE  – format version (typically 4–6)
 *   [4]    uint8      – character class  (0-6)
 *   [5]    uint8      – ascendancy class (0-3)
 *   [6]    uint8      – fullscreen flag  (version ≥ 6 only, 0 or 1)
 *   [7+]   uint16 BE  – allocated node IDs (skill hashes)
 *   [N]    uint8      – mastery selection count
 *   [N+1+] 4 bytes each – mastery pairs: [effectId(u16 BE), nodeId(u16 BE)]
 */

export interface DecodedTree {
  version: number;
  classId: number;
  ascendancyId: number;
  allocatedNodes: Set<number>;
  /** Mastery selections: masteryNodeId → selected effectId */
  masterySelections: Record<string, number>;
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
    const masterySelections: Record<string, number> = {};

    // Strategy: first read ALL uint16 as node IDs (safe baseline).
    // Then try to detect the mastery section at the end.
    // The mastery section format: [count(1 byte)][effectId(u16) nodeId(u16)] × count
    // The count byte sits right after the last node ID.
    // Total mastery bytes = 1 + count * 4
    // The remaining bytes (header to count byte) must be even (node IDs = 2 bytes each).

    // First pass: read everything as node IDs
    const allU16: number[] = [];
    for (let i = nodeStart; i + 1 < bytes.length; i += 2) {
      allU16.push(view.getUint16(i, false));
    }

    // Check if there's a trailing byte (odd remaining = count byte exists)
    const dataBytes = bytes.length - nodeStart;
    const hasTrailingByte = dataBytes % 2 === 1;

    if (hasTrailingByte) {
      // The last byte is the mastery count
      const countByte = bytes[bytes.length - 1];
      const masteryDataBytes = countByte * 4;
      // Mastery pairs sit before the count byte: pairs are the last `count` u16 pairs
      // i.e. last count*2 entries in allU16
      if (countByte > 0 && countByte * 2 <= allU16.length) {
        const nodeCount = allU16.length - countByte * 2;
        // Add regular nodes
        for (let i = 0; i < nodeCount; i++) {
          if (allU16[i] > 0) allocatedNodes.add(allU16[i]);
        }
        // Parse mastery pairs: [effectId, nodeId] × count
        for (let i = 0; i < countByte; i++) {
          const idx = nodeCount + i * 2;
          const effectId = allU16[idx];
          const nodeId = allU16[idx + 1];
          if (effectId > 0 && nodeId > 0) {
            masterySelections[nodeId] = effectId;
            allocatedNodes.add(nodeId); // mastery nodes are also allocated
          }
        }
      } else {
        // Count doesn't make sense, treat everything as nodes
        for (const id of allU16) {
          if (id > 0) allocatedNodes.add(id);
        }
      }
    } else {
      // Even data — no mastery count byte, all are node IDs
      for (const id of allU16) {
        if (id > 0) allocatedNodes.add(id);
      }
    }

    return { version, classId, ascendancyId, allocatedNodes, masterySelections };
  } catch (err) {
    console.error("[TreeDecoder] decode error:", err);
    return null;
  }
}
