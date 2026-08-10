# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-10

### Added

- **Challenge mode.** Roll a random challenge in Easy, Medium, Hard or Extreme and
  build it yourself. The generator picks a class, ascendancy and main skill and,
  as the difficulty climbs, adds a mandated weapon, a mandated unique, a mandated
  keystone, banned support gems and — on Extreme — two extra rules such as
  Solo Self-Found or a one-Divine gear budget. Every rule becomes a checklist
  objective, so challenges work in the overlay with the existing hotkeys.
- Challenges are identified by a seed (`hard:8F3K22`) and regenerate from it, so
  the same seed always produces the same challenge and can be shared with anyone
  else running the app. Paste a seed to play someone else's challenge.
- Every skill, unique and keystone the generator can roll is validated in CI
  against the bundled Path of Exile data, so a game update that renames or removes
  one fails the build instead of producing an impossible challenge.
- Challenges come with a **suggested passive tree**: a real, connected allocation
  from the class start node, inside the point budget the target level grants,
  chosen by scoring each passive against the mandated skill. The mandated keystone
  is always included; no other keystone is ever taken by accident.
- Challenges also come with **suggested gear**: real base types per slot, filtered
  by the level requirement the character will have met, the class's attributes and
  its defence type. Item modifiers are never invented — gear carries a base and a
  list of stat priorities.
- Challenges come with a **suggested gem setup**: the mandated skill plus five
  support gems that can legally link to it, taken from Path of Building's own
  `requireSkillTypes` / `excludeSkillTypes` data, so a support that would do
  nothing is never suggested. Supports that cancel each other out — Brutality
  with Elemental Focus, two flat-damage supports in the same links — are filtered
  out, and a support the challenge banned is never then suggested. A movement gem
  and an aura are added only when the challenge's own rules leave room for them.
- The suggested gems are laid out across the equipment: main links in an item that
  can hold six, then an aura group, a guard skill, a movement skill and a curse
  matched to the skill's damage type — each cut to the sockets that item really
  has, and each skipped when a challenge rule forbids it.
- `npm run data:tree`, `npm run data:bases`, `npm run data:gems` and
  `npm run data:icons` refresh the bundled game data.

### Changed

- **Updated the passive tree to 3.29 Curse of the Allflame.** 2935 → 2987 nodes,
  including the new Luminary ascendancy and the Bitter Frost, Roiling Tempest and
  Voracious Flame keystones.
- Class and ascendancy tables, and gem colour resolution, moved out of the
  importer into shared modules now used by both the importer and challenge mode.

### Fixed

- The ascendancy lookup used for imports without an explicit `ascendClassName`
  was wrong: Witch's three ascendancies were in the wrong order (an Occultist was
  labelled Necromancer, an Elementalist Occultist, a Necromancer Elementalist) and
  Ranger's first ascendancy was still called Raider instead of Warden. Scion was
  missing Reliquarian and Luminary entirely. The table is now verified against
  GGG's own tree export.
- The passive tree canvas filtered out every Luminary node, so a Luminary
  character's ascendancy rendered empty.
- Imports from the current league showed no league badge, because the tree version
  to league table stopped at 3.28.
- The gem tab counted skill groups twice, rendering "2 2 groups".

## [1.0.11] - 2026-08-05

### Fixed

- Path of Exile asset mining never ran in packaged builds. The Python miner was
  spawned with `app.getAppPath()` as its working directory, which resolves to
  `app.asar` — a file, not a directory — once packaged, so the spawn failed with
  ENOENT. The feature worked only when run from source.
- Eight of the ten languages never reached the desktop layer. Selecting Spanish,
  French, German, Russian, Korean, Chinese, Japanese or Thai left the tray menu,
  the exit dialog and every import error in the previous language, even though
  complete translations already existed for all of them.
- Hotkey rebinds the operating system refused — because another application
  already owns that shortcut — were reported as successful. Conflicts are now
  flagged in the settings panel.
- Reimporting a build silently swallowed its error, leaving the button looking
  inert. It now reports the failure like a first import does.
- The overlay could snap back while being dragged.
- Window position was written to disk synchronously on every move and resize
  tick, stalling the main process during a drag.

### Security

Both of these ship inside the installer, because `electron-updater` is a runtime
dependency:

- `builder-util-runtime` 9.5.1 → 9.7.0. It was pinned to an exact version by
  `electron-updater` 6.8.3, so no dependency update could lift it on its own.
- `js-yaml` 4.1.1 → 4.3.1.

All open Dependabot alerts cleared: 23 → 0.

### Changed

- TypeScript 7.0.2, Vite 8.2, Vitest 4.1.10, electron-builder 26.15.3,
  concurrently 10, `@types/node` 26, React 19.2.8, `actions/checkout` v7 and
  `actions/setup-node` v7.
- Pull request validation now reports the status check that branch protection
  requires, so pull requests are no longer blocked on a check that could never
  run.
- Dependabot groups routine updates into a single pull request instead of one
  per package.

## [1.0.10] - 2026-03-25

### Fixed

- CodeQL: replaced insecure `/tmp` path with local cache in `convert-ggg-tree.mjs`
- CodeQL: added network data validation before writing to disk in dev scripts

## [1.0.9] - 2026-03-25

### Fixed

- Custom PoE cursor not showing in settings dropdown (portal rendering issue)

## [1.0.7] - 2026-03-25

### Fixed

- Auto-update URL typo: `appPackageUrl` pointed to wrong GitHub user (`Elyelx` → `ElyelxD`)
- Repository URL changed from SSH to HTTPS for public contributors
- Python asset miner error messages translated from Portuguese to English

### Changed

- `.gitignore` expanded: added `*.exe`, `*.msi`, `out/`, `.mcp.json`

## [1.0.6] - 2026-03-25

### Added

- PoE-style golden cursors (arrow and hand) throughout the app
- Current app version displayed in the update panel (all 10 locales)
- Popular build sources listed in README (Mobalytics, PoE Ninja, Maxroll)

### Fixed

- Gems and gear now correctly switch when changing tree specs via PoB `{N}` spec-index matching

## [1.0.5] - 2026-03-25

### Added

- Test suite with 81 tests covering tree decoder, cluster expansion, selectors
- CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md governance documents
- GitHub issue templates (bug report, feature request) and PR template
- Dependabot configuration for npm and GitHub Actions
- CodeQL security analysis workflow
- PR validation workflow (typecheck + tests + Windows build)

### Fixed

- Unhandled promise rejections in hotkey IPC calls

### Changed

- Improved package.json metadata (license, homepage, keywords, engines)

## [1.0.4] - 2026-03-25

### Fixed

- Overlay minibar click-through so the game remains interactive behind the minimized bar
- Missing desktop API types for updater events (onUpToDate, onUpdateError)
- Auto-updater now fires real electron-updater events instead of timeout fallback

## [1.0.3] - 2026-03-23

### Added

- Overlay minimize mode: collapse to a compact bar showing build name and active tree spec
- Dedicated "Check for Updates" button in main window header with dropdown lifecycle
- Overlay opacity moved to its own separate header button with slider dropdown
- i18n keys for minimize, expand, and update across all 10 locales

### Removed

- Settings UI (hotkeys, language, opacity) from overlay panel -- kept only in main window
- Cluster node text labels below nodes (tooltips already show names on hover)

## [1.0.2] - 2026-03-23

### Added

- Cluster jewel allocation tracking with PoB-compatible virtual node IDs
- Cluster notables database (308 passives with stat descriptions)

### Fixed

- Mastery effect selection display in passive tree tooltips
- Tree hit detection accuracy for small and notable nodes
- Dropdown z-index layering in overlay mode
- Bloodline ascendancy sprite sheet rendering

## [1.0.1] - 2026-03-23

### Fixed

- Tree hit detection for nodes near edges
- Dropdown z-index conflicts in overlay mode
- Bloodline sprite rendering for certain ascendancies

## [1.0.0] - 2026-03-14

### Added

- Initial stable release
- Path of Building import (URL, code, and file)
- In-game overlay with transparent always-on-top window
- Passive tree visualization with sprite rendering and zoom/pan
- Build progression tracking with stage-based checklist
- Gem setup display with socket color matching
- Item/gear requirements panel
- 10 language support (English, Portuguese BR, Spanish, French, German, Russian, Korean, Chinese, Japanese, Thai)
- Auto-update via GitHub Releases
- System tray with quick actions
- Customizable global hotkeys
- Overlay opacity control

[1.0.4]: https://github.com/ElyelxD/Exile-Build-PoE/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/ElyelxD/Exile-Build-PoE/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/ElyelxD/Exile-Build-PoE/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/ElyelxD/Exile-Build-PoE/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ElyelxD/Exile-Build-PoE/releases/tag/v1.0.0
