import { describe, it, expect } from "vitest";
import { decodeTreeUrl, DecodedTree } from "../tree-decoder";

/**
 * Helper: build a PoB-format binary blob and encode it as base64url.
 *
 * PoB binary layout (version >= 5):
 *   [0-3]  uint32 BE  - format version
 *   [4]    uint8      - character class
 *   [5]    uint8      - ascendancy class (bits 0-1)
 *   [6]    uint8      - regular node count
 *   [7+]   uint16 BE  - regular node IDs
 *   [N]    uint8      - cluster node count (version >= 5)
 *   [N+1+] uint16 BE  - cluster node IDs (real id = value + 65536)
 *   [M]    uint8      - mastery count (version >= 6)
 *   [M+1+] 4 bytes    - mastery pairs: [effectId(u16 BE), nodeId(u16 BE)]
 */
function buildPobBlob(opts: {
  version: number;
  classId: number;
  ascendancyId: number;
  regularNodes?: number[];
  clusterNodes?: number[]; // raw values (before +65536)
  masteries?: Array<{ effectId: number; nodeId: number }>;
}): string {
  const parts: number[] = [];

  // version (u32 BE)
  parts.push((opts.version >> 24) & 0xff);
  parts.push((opts.version >> 16) & 0xff);
  parts.push((opts.version >> 8) & 0xff);
  parts.push(opts.version & 0xff);

  // classId (u8)
  parts.push(opts.classId & 0xff);

  // ascendancyId (u8, packed into bits 0-1)
  parts.push(opts.ascendancyId & 0x03);

  // regular nodes section
  const regular = opts.regularNodes ?? [];
  parts.push(regular.length & 0xff);
  for (const id of regular) {
    parts.push((id >> 8) & 0xff);
    parts.push(id & 0xff);
  }

  // cluster nodes section (version >= 5)
  if (opts.version >= 5) {
    const cluster = opts.clusterNodes ?? [];
    parts.push(cluster.length & 0xff);
    for (const id of cluster) {
      parts.push((id >> 8) & 0xff);
      parts.push(id & 0xff);
    }
  }

  // mastery section (version >= 6)
  if (opts.version >= 6) {
    const masteries = opts.masteries ?? [];
    parts.push(masteries.length & 0xff);
    for (const m of masteries) {
      parts.push((m.effectId >> 8) & 0xff);
      parts.push(m.effectId & 0xff);
      parts.push((m.nodeId >> 8) & 0xff);
      parts.push(m.nodeId & 0xff);
    }
  }

  const bytes = new Uint8Array(parts);
  const binary = String.fromCharCode(...bytes);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

describe("decodeTreeUrl", () => {
  describe("basic version 6 decoding", () => {
    it("decodes a v6 blob with regular nodes", () => {
      const encoded = buildPobBlob({
        version: 6,
        classId: 3,
        ascendancyId: 1,
        regularNodes: [100, 200, 300],
      });

      const result = decodeTreeUrl(encoded);
      expect(result).not.toBeNull();
      expect(result!.version).toBe(6);
      expect(result!.classId).toBe(3);
      expect(result!.ascendancyId).toBe(1);
      expect(result!.allocatedNodes).toEqual(new Set([100, 200, 300]));
      expect(result!.clusterAllocatedNodes.size).toBe(0);
      expect(Object.keys(result!.masterySelections)).toHaveLength(0);
    });

    it("decodes cluster nodes with +65536 offset", () => {
      const encoded = buildPobBlob({
        version: 6,
        classId: 0,
        ascendancyId: 0,
        regularNodes: [10],
        clusterNodes: [42, 100],
      });

      const result = decodeTreeUrl(encoded);
      expect(result).not.toBeNull();
      expect(result!.allocatedNodes).toEqual(new Set([10]));
      expect(result!.clusterAllocatedNodes).toEqual(new Set([65578, 65636]));
    });

    it("decodes mastery selections in v6", () => {
      const encoded = buildPobBlob({
        version: 6,
        classId: 2,
        ascendancyId: 2,
        regularNodes: [500],
        masteries: [
          { effectId: 1001, nodeId: 2001 },
          { effectId: 1002, nodeId: 2002 },
        ],
      });

      const result = decodeTreeUrl(encoded);
      expect(result).not.toBeNull();
      // Mastery nodeIds are also added to allocatedNodes
      expect(result!.allocatedNodes).toEqual(new Set([500, 2001, 2002]));
      expect(result!.masterySelections).toEqual({
        "2001": 1001,
        "2002": 1002,
      });
    });
  });

  describe("version 5 format", () => {
    it("decodes v5 with regular and cluster nodes but no masteries", () => {
      const encoded = buildPobBlob({
        version: 5,
        classId: 1,
        ascendancyId: 0,
        regularNodes: [50, 60],
        clusterNodes: [10],
      });

      const result = decodeTreeUrl(encoded);
      expect(result).not.toBeNull();
      expect(result!.version).toBe(5);
      expect(result!.allocatedNodes).toEqual(new Set([50, 60]));
      expect(result!.clusterAllocatedNodes).toEqual(new Set([65546]));
      // v5 has no mastery section
      expect(Object.keys(result!.masterySelections)).toHaveLength(0);
    });
  });

  describe("URL extraction", () => {
    it("extracts data from a GGG passive-skill-tree URL", () => {
      const encoded = buildPobBlob({
        version: 6,
        classId: 4,
        ascendancyId: 1,
        regularNodes: [777],
      });
      const url = `https://www.pathofexile.com/passive-skill-tree/${encoded}`;

      const result = decodeTreeUrl(url);
      expect(result).not.toBeNull();
      expect(result!.version).toBe(6);
      expect(result!.classId).toBe(4);
      expect(result!.allocatedNodes).toEqual(new Set([777]));
    });

    it("extracts data from a GGG URL with trailing path segments", () => {
      const encoded = buildPobBlob({
        version: 6,
        classId: 0,
        ascendancyId: 0,
        regularNodes: [123],
      });
      const url = `https://www.pathofexile.com/passive-skill-tree/3.21/${encoded}`;

      const result = decodeTreeUrl(url);
      // The function extracts the LAST segment after /passive-skill-tree/
      expect(result).not.toBeNull();
      expect(result!.allocatedNodes).toEqual(new Set([123]));
    });
  });

  describe("edge cases", () => {
    it("returns null for empty string", () => {
      expect(decodeTreeUrl("")).toBeNull();
    });

    it("returns null for short random text", () => {
      expect(decodeTreeUrl("abc")).toBeNull();
    });

    it("returns null for invalid base64 that decodes too short", () => {
      // "AAAA" decodes to 3 bytes, which is < 7 minimum
      expect(decodeTreeUrl("AAAA")).toBeNull();
    });

    it("returns null for a URL with no valid encoded data", () => {
      expect(decodeTreeUrl("https://example.com/nothing")).toBeNull();
    });

    it("decodes a blob with zero regular nodes", () => {
      const encoded = buildPobBlob({
        version: 6,
        classId: 0,
        ascendancyId: 0,
        regularNodes: [],
        clusterNodes: [],
        masteries: [],
      });

      const result = decodeTreeUrl(encoded);
      expect(result).not.toBeNull();
      expect(result!.allocatedNodes.size).toBe(0);
      expect(result!.clusterAllocatedNodes.size).toBe(0);
    });

    it("handles base64url characters (- and _) correctly", () => {
      // buildPobBlob already converts to base64url, but let's ensure
      // the decoder works with them
      const encoded = buildPobBlob({
        version: 6,
        classId: 6,
        ascendancyId: 3,
        regularNodes: [65000],
      });

      const result = decodeTreeUrl(encoded);
      expect(result).not.toBeNull();
      expect(result!.classId).toBe(6);
      expect(result!.ascendancyId).toBe(3);
      expect(result!.allocatedNodes).toEqual(new Set([65000]));
    });
  });

  describe("version detection", () => {
    it("correctly reads version 4 (older format)", () => {
      // Version 4 is < 5, so it uses the heuristic fallback parser
      const encoded = buildPobBlob({
        version: 4,
        classId: 2,
        ascendancyId: 1,
        regularNodes: [100, 200],
      });

      const result = decodeTreeUrl(encoded);
      expect(result).not.toBeNull();
      expect(result!.version).toBe(4);
    });

    it("correctly reads version 6", () => {
      const encoded = buildPobBlob({
        version: 6,
        classId: 0,
        ascendancyId: 0,
        regularNodes: [1],
      });

      const result = decodeTreeUrl(encoded);
      expect(result).not.toBeNull();
      expect(result!.version).toBe(6);
    });
  });

  describe("ascendancy extraction", () => {
    it("extracts ascendancy from lower 2 bits of byte 5", () => {
      const encoded = buildPobBlob({
        version: 6,
        classId: 5,
        ascendancyId: 2,
        regularNodes: [1],
      });

      const result = decodeTreeUrl(encoded);
      expect(result).not.toBeNull();
      expect(result!.ascendancyId).toBe(2);
    });

    it("ascendancyId 0 means no ascendancy", () => {
      const encoded = buildPobBlob({
        version: 6,
        classId: 1,
        ascendancyId: 0,
        regularNodes: [1],
      });

      const result = decodeTreeUrl(encoded);
      expect(result).not.toBeNull();
      expect(result!.ascendancyId).toBe(0);
    });
  });
});
