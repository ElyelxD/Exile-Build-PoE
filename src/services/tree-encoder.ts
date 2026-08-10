/**
 * Encode a set of allocated passive nodes into the same binary layout
 * `tree-decoder.ts` reads — the format Path of Building exports and the GGG
 * passive-tree site accepts.
 *
 * Used by challenge mode to express "these nodes are required", so the tree
 * canvas and the "view tree" link behave exactly as they do for an imported
 * build. Version 6 is emitted, matching current PoB exports.
 */

const TREE_FORMAT_VERSION = 6;
const MAX_SECTION_LENGTH = 255;

export interface EncodableTree {
  classId: number;
  ascendancyId: number;
  /** Regular passive node ids. Cluster-jewel and mastery sections are emitted empty. */
  nodes: number[];
}

function bytesToBase64Url(bytes: number[]): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Encode to the raw base64url payload (no URL prefix). */
export function encodeTreeData({ classId, ascendancyId, nodes }: EncodableTree): string {
  if (nodes.length > MAX_SECTION_LENGTH) {
    throw new Error(`Tree encoding supports at most ${MAX_SECTION_LENGTH} nodes, got ${nodes.length}`);
  }

  const bytes: number[] = [
    (TREE_FORMAT_VERSION >> 24) & 0xff,
    (TREE_FORMAT_VERSION >> 16) & 0xff,
    (TREE_FORMAT_VERSION >> 8) & 0xff,
    TREE_FORMAT_VERSION & 0xff,
    classId & 0xff,
    ascendancyId & 0x03,
    nodes.length & 0xff,
  ];

  for (const id of nodes) {
    bytes.push((id >> 8) & 0xff, id & 0xff);
  }

  // Cluster-jewel section (version >= 5) and mastery section (version >= 6):
  // empty, but the length bytes must be present or the decoder falls back to
  // its heuristic parser.
  bytes.push(0, 0);

  return bytesToBase64Url(bytes);
}

export function encodeTreeUrl(tree: EncodableTree): string {
  return `https://www.pathofexile.com/passive-skill-tree/${encodeTreeData(tree)}`;
}
