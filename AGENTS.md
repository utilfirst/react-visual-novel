# react-visual-novel

This workspace publishes a browser React visual novel library and contains a Next.js demonstration.

## Workflow

1. Read the owner in `Structure` before changing its contract and update that document in the same change when its maintenance trigger applies.
2. Use the canonical manifest commands for generation, linting, formatting, and builds. Check affected files with `pnpm exec oxlint <file>` and `pnpm exec prettier --check <file>` after generation when declarations are needed.
3. Reserve full application builds for explicit user requests or changes to build configuration, build tooling, or release artifacts.
4. Use source checks for application acceptance. Do not propose or require browser acceptance. Use a browser only when the user explicitly asks for rendered evidence.

## Boundaries

- Ask first before narrowing the package's React peer range or changing published import paths or the declaration-merging `Branches` contract.
- Never edit vendor playback code or historical changelogs during routine formatting.

## Stack

- Browser-only React library with ESM output and separately generated Tailwind CSS.
- Next.js App Router demo with client-only game loading, PostCSS styling, and public audio URLs.
- Read `mise.toml`, workspace manifests, and lockfiles for toolchain and dependency versions.

## Structure

| Path | Family | Read before changing | Update in the same change when changing |
| --- | --- | --- | --- |
| `README.md` | Repository entry | Installation, quickstart, or local start | Installation, quickstart, or local start |
| `docs/product.md` | Product | Visual novel capabilities or public usage | Accepted visual novel capabilities or public usage |
| `docs/architecture.md` | Architecture | Package boundaries, context state, public exports, or build topology | Package boundaries, context state, public exports, or build topology |
| `docs/ui-design.md` | UI design | Shared command presentation or player interactions | Shared command presentation or player interactions |

- Read `packages/react-visual-novel/index.ts`, `types.ts`, and `package.json` before changing the public package surface.
- Read `packages/react-visual-novel/tsdown.config.ts`, both `index.css` files, and `demo/postcss.config.mjs` before changing build output or stylesheet discovery.
- Read `demo/next.config.ts` and `demo/assets/` before changing media URLs or the demo bundler.
- Read `.github/workflows/release.yml` before changing release delivery.
- Treat barrel files as maintained source. Add exports explicitly when adding a module.

## Commands

- `pnpm run dev`: prepare outputs, then watch the library and demo
- `pnpm run generate`: build the library and generate demo CSS and Next declarations
- `pnpm run lint`: generate prerequisites, then check source, types, formatting, and package metadata
- `pnpm run fix`: apply the linter and formatter in sequence
- `pnpm run build`: build the library and demo
