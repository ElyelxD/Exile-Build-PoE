/**
 * Decode a PoB / GGG passive skill tree URL to extract allocated node IDs,
 * cluster jewel node allocations, and mastery effect selections.
 *
 * PoB binary layout (version ≥ 5):
 *   [0-3]  uint32 BE  – format version (4–6)
 *   [4]    uint8      – character class  (0-6)
 *   [5]    uint8      – ascendancy class (packed: bits 0-1 primary, 2-3 secondary)
 *   [6]    uint8      – regular node count
 *   [7+]   uint16 BE  – regular node IDs  (count × 2 bytes)
 *   [N]    uint8      – cluster node count  (version ≥ 5)
 *   [N+1+] uint16 BE  – cluster node IDs   (count × 2 bytes, real id = value + 65536)
 *   [M]    uint8      – mastery count       (version ≥ 6)
 *   [M+1+] 4 bytes    – mastery pairs: [effectId(u16 BE), nodeId(u16 BE)]
 */

export interface DecodedTree {
  version: number;
  classId: number;
  ascendancyId: number;
  allocatedNodes: Set<number>;
  /** Cluster jewel virtual node IDs (>= 65536) that are allocated */
  clusterAllocatedNodes: Set<number>;
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

/** Read a u16 BE at the given byte offset. */
function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, false);
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
    const ascendancyId = bytes[5] & 0x03; // bits 0-1

    const allocatedNodes = new Set<number>();
    const clusterAllocatedNodes = new Set<number>();
    const masterySelections: Record<string, number> = {};

    // Version ≥ 5: count-based sections (PoB format)
    if (version >= 5 && bytes.length >= 7) {
      let offset = 6;

      // Section 1: Regular nodes
      const regularCount = bytes[offset++];
      for (let i = 0; i < regularCount && offset + 1 < bytes.length; i++) {
        const id = readU16(view, offset);
        offset += 2;
        if (id > 0) allocatedNodes.add(id);
      }

      // Section 2: Cluster nodes (version ≥ 5)
      if (offset < bytes.length) {
        const clusterCount = bytes[offset++];
        for (let i = 0; i < clusterCount && offset + 1 < bytes.length; i++) {
          const rawId = readU16(view, offset);
          offset += 2;
          const clusterId = rawId + 65536;
          clusterAllocatedNodes.add(clusterId);
        }
      }

      // Section 3: Mastery effects (version ≥ 6)
      if (version >= 6 && offset < bytes.length) {
        const masteryCount = bytes[offset++];
        for (let i = 0; i < masteryCount && offset + 3 < bytes.length; i++) {
          const effectId = readU16(view, offset);
          const nodeId = readU16(view, offset + 2);
          offset += 4;
          if (effectId > 0 && nodeId > 0) {
            masterySelections[nodeId] = effectId;
            allocatedNodes.add(nodeId);
          }
        }
      }

      // Validate: count-based parsing should consume ALL data (±1 byte for alignment).
      // If it doesn't, this isn't a PoB count-based format — fall back to heuristic.
      const remaining = bytes.length - offset;
      if (remaining <= 1) {
        return { version, classId, ascendancyId, allocatedNodes, clusterAllocatedNodes, masterySelections };
      }
    }

    // Fallback: heuristic parser for version < 5 or non-count-based formats
    allocatedNodes.clear();
    clusterAllocatedNodes.clear();

    const nodeStart = version >= 6 ? 7 : 6;
    const allU16: number[] = [];
    for (let i = nodeStart; i + 1 < bytes.length; i += 2) {
      allU16.push(readU16(view, i));
    }

    const dataBytes = bytes.length - nodeStart;
    const hasTrailingByte = dataBytes % 2 === 1;

    if (hasTrailingByte) {
      const countByte = bytes[bytes.length - 1];
      if (countByte > 0 && countByte * 2 <= allU16.length) {
        const nodeCount = allU16.length - countByte * 2;
        for (let i = 0; i < nodeCount; i++) {
          if (allU16[i] > 0) allocatedNodes.add(allU16[i]);
        }
        for (let i = 0; i < countByte; i++) {
          const idx = nodeCount + i * 2;
          const effectId = allU16[idx];
          const nodeId = allU16[idx + 1];
          if (effectId > 0 && nodeId > 0) {
            masterySelections[nodeId] = effectId;
            allocatedNodes.add(nodeId);
          }
        }
      } else {
        for (const id of allU16) {
          if (id > 0) allocatedNodes.add(id);
        }
      }
    } else {
      for (const id of allU16) {
        if (id > 0) allocatedNodes.add(id);
      }
    }

    return { version, classId, ascendancyId, allocatedNodes, clusterAllocatedNodes, masterySelections };
  } catch (err) {
    console.error("[TreeDecoder] decode error:", err);
    return null;
  }
}
