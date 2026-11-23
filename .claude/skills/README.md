# Project skills

## Third-party: addyosmani/agent-skills

Copied from https://github.com/addyosmani/agent-skills at commit `8c99fa3` (2026-11-18),
MIT license (`LICENSE-addyosmani-agent-skills`). Reviewed before copying: instruction files only,
no scripts. 12 of the 24 skills were kept, the ones relevant to this small static web app:

test-driven-development, incremental-implementation, frontend-ui-engineering,
source-driven-development, debugging-and-error-recovery, git-workflow-and-versioning,
code-review-and-quality, code-simplification, documentation-and-adrs, spec-driven-development,
planning-and-task-breakdown, ci-cd-and-automation.

Left out: production/ops skills (observability, shipping, deprecation, security, performance),
API design, doubt-driven development, interview/idea skills, the meta skill, and
browser-testing-with-devtools (needs the chrome-devtools MCP server, not set up yet).

To update: re-clone the repository, review the diff, copy the same folders again.

## Project-specific

- `leslie-midi-safety`: rules for anything that sends MIDI to the Leslie.
- `leslie-hardware-test`: protocol for testing on the real machine with dumps.
