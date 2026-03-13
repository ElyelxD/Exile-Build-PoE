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

export function decodeTreeUrl(url: string): DecodedTree | null {
  try {
    const marker = "/passive-skill-tree/";
    const idx = url.indexOf(marker);

    if (idx < 0) return null;

    const rest = url.slice(idx + marker.length);
    // The encoded data is the last non-empty path segment
    const segments = rest.split("/").filter(Boolean);
    const encoded = segments[segments.length - 1];

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
  } catch {
    return null;
  }
}
