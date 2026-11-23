# Leslie 2101/2103 mk2 editor

Static web app (Vite + TypeScript, no framework) that edits a Leslie 2101/2103 mk2 over Web MIDI.
Chrome/Edge only. Read `PRODUCT.md` (goals), `DESIGN.md` (visual system), `docs/dump-map.md`
(everything verified on the machine) before changing behavior.

- Code and comments in English. UI in English (international project); a French pack exists in
  `src/content/*.fr.ts` for later. The owner writes in French: answer in French.
- `src/params/schema.ts` is the single source of truth for parameters.
- Commands: `npm run dev` (port 5173, also `.claude/launch.json`), `npm test`, `npm run typecheck`.

## MIDI and hardware

- Anything that sends MIDI: follow the `leslie-midi-safety` skill. Never send an unconfirmed SysEx,
  never send before a dump is loaded, always go through the tee sink (echo detection).
- Anything that depends on how the machine reacts: follow the `leslie-hardware-test` skill. The
  user runs hardware tests in Chrome; the in-app browser has no Web MIDI (use the dev-only
  `window.__midiIn([...])` hook to inject incoming bytes there).

## When to use which tool

**While working (load when relevant)**
- Logic or bug fix: `test-driven-development`. Multi-file change: `incremental-implementation`.
- Library or web API details (Vite, Vitest, TypeScript, Web MIDI): query the **context7** MCP and
  follow `source-driven-development` rather than relying on memory.
- UI work: `frontend-ui-engineering` for structure and accessibility, `impeccable` for visual
  design (reads `PRODUCT.md`, `DESIGN.md`, `.impeccable/`).
- Unexpected behavior: `debugging-and-error-recovery`.
- Large new feature: `spec-driven-development`, then `planning-and-task-breakdown`.

**Every commit**
- The pre-commit hook (`.githooks/pre-commit`) runs typecheck + tests; do not bypass it.
- Small, coherent commits (`git-workflow-and-versioning`). Branch first when on `main`.

**Before every push / pull request**
- Run `code-review-and-quality` on the diff and fix what it finds; `code-simplification` if the
  change grew complex.
- If the diff touches `src/ui/` or styles: `/impeccable audit` and `web-design-guidelines`.
  The Impeccable design hook already runs the detector after each UI edit and on Stop
  (`.impeccable/config.json`; machine setup: link `.claude/skills/impeccable` to the global skill,
  then `impeccable hooks on`, which writes the gitignored `.claude/settings.local.json`).
  Fix real findings; add ignores only through `impeccable hooks ignore-*` with a reason.
- When `DESIGN.md` changes, regenerate `.impeccable/design.json` (`/impeccable document`).
- If a user-visible behavior or a design decision changed: update the docs and record the
  decision as an ADR in `docs/adr/` (`documentation-and-adrs`).
- CI pipeline changes: `ci-cd-and-automation`.
