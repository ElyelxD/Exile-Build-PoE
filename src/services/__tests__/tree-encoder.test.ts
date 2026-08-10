import { describe, it, expect } from "vitest";
import { decodeTreeUrl } from "../tree-decoder";
import { encodeTreeData, encodeTreeUrl } from "../tree-encoder";

/**
 * Business rules under test:
 *
 * The encoder must produce exactly what Path of Building exports, because the
 * result is fed to the same decoder the importer uses and is offered to the user
 * as a "view tree" link. Concretely:
 *   - version 6, class byte, ascendancy byte packed into bits 0-1, then the
 *     count-prefixed node section, then the (empty) cluster and mastery sections;
 *   - the decoder must consume the payload with its count-based parser, not fall
 *     back to its heuristic one — a payload that only survives the fallback is
 *     not PoB-compatible;
 *   - more nodes than the one-byte count can hold is a programming error and
 *     must throw instead of silently truncating the requirement list.
 */

describe("encodeTreeData", () => {
  it("round-trips class, ascendancy and nodes through the decoder", () => {
    const encoded = encodeTreeData({ classId: 1, ascendancyId: 3, nodes: [31961, 11455] });
    const decoded = decodeTreeUrl(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.version).toBe(6);
    expect(decoded!.classId).toBe(1);
    expect(decoded!.ascendancyId).toBe(3);
    expect([...decoded!.allocatedNodes].sort()).toEqual([11455, 31961]);
    expect(decoded!.clusterAllocatedNodes.size).toBe(0);
    expect(decoded!.masterySelections).toEqual({});
  });

  it("encodes an empty requirement list without allocating anything", () => {
    const decoded = decodeTreeUrl(encodeTreeData({ classId: 6, ascendancyId: 2, nodes: [] }));

    expect(decoded!.allocatedNodes.size).toBe(0);
    expect(decoded!.classId).toBe(6);
    expect(decoded!.ascendancyId).toBe(2);
  });

  it("round-trips every class and ascendancy combination", () => {
    for (let classId = 0; classId <= 6; classId++) {
      for (let ascendancyId = 0; ascendancyId <= 3; ascendancyId++) {
        const decoded = decodeTreeUrl(encodeTreeData({ classId, ascendancyId, nodes: [10808] }));

        expect(decoded!.classId).toBe(classId);
        expect(decoded!.ascendancyId).toBe(ascendancyId);
        expect([...decoded!.allocatedNodes]).toEqual([10808]);
      }
    }
  });

  it("emits the documented byte layout", () => {
    // version 6 | class 1 | asc 2 | 1 node | node 0x7CD9 | 0 clusters | 0 masteries
    const encoded = encodeTreeData({ classId: 1, ascendancyId: 2, nodes: [31961] });
    const bytes = [...atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))].map((c) => c.charCodeAt(0));

    expect(bytes).toEqual([0, 0, 0, 6, 1, 2, 1, 0x7c, 0xd9, 0, 0]);
  });

  it("produces url-safe base64 without padding", () => {
    const encoded = encodeTreeData({ classId: 3, ascendancyId: 1, nodes: [22088, 56075, 34098] });

    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("refuses to truncate a node list larger than the count byte", () => {
    const nodes = Array.from({ length: 256 }, (_, index) => index + 1);

    expect(() => encodeTreeData({ classId: 0, ascendancyId: 0, nodes })).toThrow(/at most 255/);
  });
});

describe("encodeTreeUrl", () => {
  it("produces a passive-skill-tree URL the decoder accepts", () => {
    const url = encodeTreeUrl({ classId: 2, ascendancyId: 1, nodes: [42178] });

    expect(url.startsWith("https://www.pathofexile.com/passive-skill-tree/")).toBe(true);
    expect([...decodeTreeUrl(url)!.allocatedNodes]).toEqual([42178]);
  });
});
