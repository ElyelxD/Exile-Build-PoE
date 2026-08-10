# Challenge Mode — Business Rules

Random **challenge** generator: the app rolls a set of rules the player must respect,
not a playable Path of Building build. Everything is generated offline from curated
local data — no network, no AI, no game-data simulation.

Alongside the rules, the generator produces a **suggested build**: a real passive
allocation and a real set of base items. The line it does not cross is fabrication —
anything it shows is either computed from real data or a rule, never invented:

| Part | Status | Why |
|------|--------|-----|
| Passive path | **Computed** | Real pathfinding over the bundled tree graph. Connected, within the level's point budget, scored against the skill's tags. |
| Base items | **Computed** | Real base types from PoB's item data, filtered by level requirement and the class's attributes. |
| Item modifiers | **Never emitted** | No mod pool exists in any bundled data. Gear carries a base and stat *priorities*, never rolled affixes. |
| Gem links | **Computed** | Legality comes from PoB's `requireSkillTypes` / `excludeSkillTypes`; which of the legal supports to pick is a documented judgement (see M5). |
| Gem levels and quality | **Never emitted** | Nothing in the data says what level a gem should be at, and a number here would be invented. |

The distinction the UI must preserve: **rules are binding, suggestions are not.**
The mandated skill, weapon, unique and keystone are the challenge; the rest of the
tree and the gear are a starting point the player is free to replace.

## 1. Identity and determinism

A challenge is fully identified by `difficulty` + `seed`:

```
sourceType  = "random"
sourceValue = "<difficulty>:<SEED>"        e.g. "hard:8F3K22"
```

- `difficulty` ∈ `easy | medium | hard | extreme`
- `SEED` — 6 chars over the alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`
  (Crockford base32: no `I`, `L`, `O`, `U`, so a seed read out loud is unambiguous)

**Rule D1 — Purity.** `generateChallenge(difficulty, seed)` is a pure function. The same
pair always produces a deeply equal `ChallengeSpec`.

**Rule D2 — Idempotence.** Because of D1, regenerating a stored challenge (app restart,
`rehydrate`, "re-roll same seed") produces the identical challenge. Nothing about a
challenge is persisted beyond `sourceValue` — the spec is derived, never stored.

**Rule D3 — Shareability.** A seed string is the whole challenge. Two players entering
`hard:8F3K22` get the same rules.

## 2. Difficulty rubric

Constraints are **cumulative**: every rule of a lower tier is present in the higher one.

| Rule slot                        | Easy | Medium | Hard | Extreme |
|----------------------------------|:----:|:------:|:----:|:-------:|
| Class + ascendancy               |  ✔   |   ✔    |  ✔   |    ✔    |
| Mandated main skill              |  ✔   |   ✔    |  ✔   |    ✔    |
| Mandated weapon family           |      |   ✔    |  ✔   |    ✔    |
| Mandated unique item             |      |   ✔    |  ✔   |    ✔    |
| Banned: movement skills          |      |   ✔    |  ✔   |    ✔    |
| Mandated keystone                |      |        |  ✔   |    ✔    |
| Banned: any other unique         |      |        |  ✔   |    ✔    |
| Banned: 2 support gems           |      |        |  ✔   |    ✔    |
| Extra hardcore rules             |      |        |      |  ✔ (2)  |
| **Target level**                 |  70  |   80   |  90  |   95    |

**Rule R1 — Monotonicity.** `ruleCount(easy) < ruleCount(medium) < ruleCount(hard) < ruleCount(extreme)`.

## 3. Coherence rules

A roll that cannot be played is worthless, so the generator picks in dependency order
and filters each pick against what came before.

**Rule C1 — Pick order.** class → ascendancy → main skill → weapon → unique → keystone →
banned supports → extra rules.

**Rule C2 — Ascendancy belongs to the class.** Only the three ascendancies of the rolled
class are eligible (Scion: `Ascendant`).

**Rule C3 — Weapon fits the skill.** The mandated weapon family is drawn from the
`weapons` list of the mandated skill. A skill usable with anything (`any`) can draw any
family; a bow skill only ever draws `bow`.

**Rule C4 — Keystone does not contradict the skill.** Each keystone declares `requires`
and `forbids` tags. A keystone is eligible only if the skill has every `requires` tag and
none of the `forbids` tags. Examples: `Ancestral Bond` requires `totem`; `Resolute
Technique` forbids `crit` and requires `attack`; `Minion Instability` requires `minion`.

**Rule C5 — Mandated unique fits the slot rules.** The mandated unique is exempt from the
"no other uniques" ban (hard/extreme), and its slot never collides with the mandated
weapon family — a mandated weapon unique replaces the weapon-family rule instead of
contradicting it.

**Rule C6 — Banned supports must be relevant to the skill.** The ban pool is exactly
the set of supports the suggested links would have wanted (see M5): legal for the skill
per PoB's data, relevant to its tags, ranked by priority. Banning a support the build
could never have socketed is a fake rule that costs the player nothing.

**Rule C7 — Extreme rules are distinct and non-contradictory.** The two extra rules are
drawn without replacement and each declares `conflicts` tags checked against the rest of
the spec (e.g. `no-life-on-gear` conflicts with a `Chaos Inoculation` keystone only in
that it is redundant — redundant pairs are filtered out).

## 4. Mapping onto the app model

The challenge becomes a normal `Build`, so it inherits the build list, the overlay,
hotkeys, checklist progress and deletion for free.

| Challenge concept        | Build field                                         |
|--------------------------|-----------------------------------------------------|
| Class / ascendancy       | `build.className` / `build.ascendancy`              |
| Seed + difficulty        | `build.sourceValue`, shown as a badge               |
| Every rule               | one `stages[0].checklist` item (→ overlay objectives)|
| Fixed picks (asc, skill) | `build.labs` character cards                        |
| Mandated skill + links   | `pob.skillGroups[0]` — `setTitle` "Required"        |
| Suggested utility gems   | further `pob.skillGroups` — `setTitle` "Suggested"  |
| Mandated unique + bases  | `pob.items` — real names, **no invented mods**      |
| Planned passive path     | `pob.treeSpecs[0]` — encoded allocation             |
| Target level             | `pob.level`                                         |

**Rule M1 — No fabricated data.** Item `rawText` carries the header lines only
(rarity and name), so an item card renders without a mod list rather than with a fake
one. A slot a mandated unique already fills never also gets a suggested base.

**Rule M2 — The tree spec carries a real, legal path.** `treeSpecs[0]` encodes the
full planned allocation, so the canvas draws a connected tree exactly as it would for
an imported build. The plan is produced by `tree-planner.ts`:

- allocation starts at the class's real start node and every allocated node is
  reachable through other allocated nodes — a disconnected plan is illegal in game
  and is asserted against in tests;
- the point budget is `level - 1 + 22` (one per level after the first, plus act
  quest points); ascendancy points are separate and never counted;
- the mandated keystone is connected first, then notables are attached by best
  score-per-extra-point, scoring each node's own stat text against the skill's tags;
- keystones are **never** picked up opportunistically — they redefine how a build
  works, so taking one by accident would sabotage the player;
- at most 35% of the budget goes to nodes that offer defence and nothing else.

**Rule M5 — Suggested links must be legal, relevant and consistent.** `gem-planner.ts`
answers three separate questions, and all three have to pass:

1. *Legal?* — from PoB's own data: the support's `requireSkillTypes` must intersect the
   skill's `skillTypes`, and its `excludeSkillTypes` must not. This is why Greater
   Multiple Projectiles never appears on Cyclone.
2. *Relevant?* — the game lets Brutality support a chaos skill whose damage it would
   delete, so a second layer gates supports on the skill's own tags, and a conflict
   table stops pairs that cancel out (Brutality with Elemental Focus, Concentrated
   Effect with Increased Area of Effect, two flat-damage supports in the same links).
3. *Consistent?* — a support the challenge banned is never then suggested, and utility
   gems only appear when the rules leave room: no movement gem when movement skills
   are banned, no aura when the challenge banned auras.

Supports that change *how* a skill is delivered — totems, traps, mines, triggers — are
never suggested inside the main links. That is a different build, not a support choice.

**Rule M6 — The gem layout follows the items.** A character sockets gems in equipment,
so the plan is laid out that way: the main links go in a suggested item that can hold
six gems, and each remaining socketed item gets one utility group — an aura group, a
guard skill on a trigger, a movement skill, a curse matched to the skill's damage type.
Every group is cut to the sockets that item actually has (body armours and two-handers
hold 6, helmets/gloves/boots 4, one-handers and shields 3), and no item ever holds two
groups. When no suggested item can hold six gems — because a mandated unique took the
body armour slot, say — the main group is simply left unassigned rather than claiming
sockets nobody knows exist.

**Rule M2b — Gear picks are wearable.** `gear-planner.ts` picks, per slot, the
highest-requirement base the character can actually equip: level requirement ≤ target
level, attribute requirements within the class's own attributes, defence type matching
the class (Armour for Marauder, Energy Shield for Witch, and so on). The mandated
weapon is the deliberate exception to the attribute rule — forcing a wand onto a
Ranger is the kind of constraint a challenge exists to impose.

**Rule M3 — Rehydrate regenerates.** `rehydrateImportedBuild` must branch on
`sourceType === "random"` and rebuild from `sourceValue` instead of running the PoB
snapshot path, which would overwrite the challenge stage. By D1 the result is identical,
so stored checklist progress keeps matching (checklist ids derive from `build.id`).

**Rule M4 — Re-import means re-roll same seed.** The existing re-import action stays
meaningful and, by D2, is a no-op in content. Rolling a *new* challenge is a separate
action that mints a new seed.

## 5. Data sources

| Data                        | Source                                            | Refresh |
|-----------------------------|---------------------------------------------------|---------|
| Classes / ascendancies      | `src/domain/poe-classes.ts`, verified against GGG's tree export | manual |
| Passive tree + keystones    | `src/data/tree-default.json`                      | `npm run data:tree` |
| Base items (level, attributes, defence) | `src/data/base-items.json`            | `npm run data:bases` |
| Gem link rules and colours  | `src/data/gems.json`                              | `npm run data:gems` |
| Skills, uniques, rules pool | `src/data/challenge-pool.json` (hand-curated)     | manual |
| Gem colours / icons         | `gem-colors.json`, `poe-icons.json`               | see below |

### Validating the pool against a live patch

The pool holds game names, and game names change between leagues. GGG's trade API
lists everything currently in the game and is the cheapest way to check:

```
curl -s https://www.pathofexile.com/api/trade/data/items
```

Cross-referencing it against the pool is how `Dark Pact` was found to have been
removed in 3.29. The bundled `gem-colors.json` and `poe-icons.json` cannot currently
be refreshed: `scripts/fetch-poe-icons.mjs` targets poe.ninja's
`/api/data/ItemOverview` endpoint, which now returns 404 for every league including
Standard. Until that script is repointed, gems added after the bundled snapshot have
no colour and no icon — they resolve to a blue gem with no image rather than failing.

**Rule S1 — Curated pool only.** Rolling over all 1047 active gems produces nonsense
(`Portal`, auras, transfigured variants). The skill pool is hand-curated and every entry
carries the tags the coherence rules need.

**Rule S2 — Keystone ids are verified against the bundled tree.** A test asserts every
`nodeId` in the pool exists in `tree-default.json` and is a type-2 node, so a tree update
that removes a keystone fails CI instead of silently producing a broken challenge.
