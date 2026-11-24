# ADR 0005: Hosting on GitHub Pages

- Status: accepted, 2026-11-24

## Context

The owner wanted the editor online, at a github.io address. It is a static site without a backend, and Web
MIDI needs HTTPS, which Pages provides.

## Decision

1. `.github/workflows/pages.yml` checks every push and pull request (types, tests, build) and deploys `main`.
   Actions are pinned to a commit. A failed check does not deploy.
2. The build uses relative links (`base: './'`): the same files work in the Pages folder, or later on a domain.
3. The licenses of the editor and of the bundled fonts are published with the site (`public/licenses.txt`) and linked
   next to the credits: the OFL asks for its text with every copy of the fonts.

## Consequences

- Pushing to `main` publishes. To go back: revert the commit, or run the workflow again from an older one.
- The dev-only `__midiIn` hook and the fixtures are not in the site.
