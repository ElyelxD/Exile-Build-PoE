/**
 * Character classes and their ascendancies, keyed by the numeric ids Path of
 * Building writes into a build XML and into the encoded passive tree URL.
 *
 * Shared by the PoB importer (reading ids) and the challenge generator (writing
 * them), so the two can never drift apart.
 */

export const CLASS_ID_TO_NAME: Record<string, string> = {
  "0": "Scion",
  "1": "Marauder",
  "2": "Ranger",
  "3": "Witch",
  "4": "Duelist",
  "5": "Templar",
  "6": "Shadow",
};

/**
 * Order matters: the index is the `ascendClassId` Path of Building writes, so it
 * must match the order GGG publishes in `classes[].ascendancies` in the tree
 * export. Verified against the 3.29 (Curse of the Allflame) export — an earlier
 * hand-written table had Witch's three in the wrong order and still called
 * Ranger's first ascendancy "Raider", which mislabelled every import that had no
 * explicit `ascendClassName`.
 */
export const ASCENDANCY_BY_CLASS_ID: Record<string, Record<string, string>> = {
  "0": { "1": "Ascendant", "2": "Reliquarian", "3": "Luminary" },
  "1": { "1": "Juggernaut", "2": "Berserker", "3": "Chieftain" },
  "2": { "1": "Warden", "2": "Deadeye", "3": "Pathfinder" },
  "3": { "1": "Occultist", "2": "Elementalist", "3": "Necromancer" },
  "4": { "1": "Slayer", "2": "Gladiator", "3": "Champion" },
  "5": { "1": "Inquisitor", "2": "Hierophant", "3": "Guardian" },
  "6": { "1": "Assassin", "2": "Trickster", "3": "Saboteur" },
};

export const CLASS_IDS = Object.keys(CLASS_ID_TO_NAME);

export function ascendancyIdsForClass(classId: string): string[] {
  return Object.keys(ASCENDANCY_BY_CLASS_ID[classId] ?? {});
}
