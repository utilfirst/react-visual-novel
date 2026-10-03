# Architecture

This document owns the library and demonstration boundaries and their state relationships. The design follows the implemented source owners listed below. [Product](product.md) owns accepted capabilities and [UI design](ui-design.md) owns presentation. Exact command and package contracts stay in the manifests and configuration.

| Decision | Read |
| --- | --- |
| Change state or navigation | [Playback state](#playback-state) |
| Change package or demo builds | [Package boundaries](#package-boundaries) |
| Find an implementation owner | [Implementation owners](#implementation-owners) |

## Package boundaries

`packages/react-visual-novel` is the published browser package. Its ESM entry exports commands, components, contexts, types, and asset preloading. Type declarations accompany the entry. `Branches` is an augmentation point for host-defined branch identifiers. Existing `dist/index.css` and `dist/index.js` imports remain supported through the package exports.

Tsdown bundles library source and leaves dependencies and peers external. Tailwind generates the library utility stylesheet separately. The library and demo import shared scrim CSS. The demo supplies the `rvn-*` component treatments in `demo/index.css` and compiles them with its local theme. The host application owns its component styling and query parameter provider.

The demo consumes the workspace package through the same package entry used by installed consumers. It uses the Next.js Pages Router, client-only game loading, and webpack asset modules for imported MP3 URLs. Its commands select webpack to preserve that media contract.

`mise.toml` owns runtime pins and `mise.lock` owns their platform resolutions. Root scripts prepare library output, demo CSS, and Next declarations before checks and development. Generated output is disposable and excluded from source ownership.

The release workflow packages a checked version tag and passes its tarball to a separate npm publishing job. Trusted publisher and GitHub environment configuration must be verified before release delivery. The workflow owns exact runner permissions and commands.

## Playback state

`GameContext` owns location, audio mute, pause, navigation, and host callbacks. The `location` query parameter reflects the selected branch and statement. Local storage retains pause and location history under the existing keys. The history owner provides back navigation and resets. Local hooks own persistence synchronization, committed callbacks, resize observation, and long-press timing.

`BranchContext` registers statements, measures the branch container, resolves labels, and advances playback. `StatementContext` derives focus and visibility from the branch location and each command's hiding rule. `Command` connects statement registration to animation, timing, and audio playback.

Audio players are cached by source configuration. Named audio channels coordinate interruption and overlap. The audio owner notifies pending playback operations when their playing state changes. Asset preloading uses a local worker queue and reports progress and failure through the game render callback. The vendor unmute helper supplies iOS audio behavior. Its retained source bytes stay outside lint and formatting.

## Trust and failure

Host assets, React children, and callbacks enter through public component contracts. Query parameters and browser storage are persisted inputs whose identifiers and keys must survive maintenance changes. Markdown text is rendered as React content rather than raw HTML. Unsupported syntax is reported by the parser owner.

The library requires browser APIs and host-supplied peers. The demo loads the game with server rendering disabled. Missing providers throw at the context hook boundary. Persisted pause and history values are decoded before use. Unavailable browser storage falls back to in-memory state. Asset failures are presented through the preload result. Browser playback and interaction are verified with developer-provided runtime evidence unless rendered evidence is explicitly requested.

## Implementation owners

| Contract | Owner |
| --- | --- |
| Public exports and augmentation | `packages/react-visual-novel/index.ts`, `types.ts`, `package.json` |
| Statement composition and player controls | `packages/react-visual-novel/components/` |
| Location, focus, visibility, and history | `packages/react-visual-novel/contexts/` |
| Audio and asset loading | `packages/react-visual-novel/lib/` |
| Command presentation and Markdown | `packages/react-visual-novel/commands/` |
| Bundle and CSS generation | `packages/react-visual-novel/tsdown.config.ts`, both Tailwind configs, workspace manifests |
| Demo routes and imported media | `demo/pages/`, `demo/next.config.ts` |
| Lint and formatting | `oxlint.config.ts`, `prettier.config.ts`, workspace TypeScript configs |
| Release delivery | `.github/workflows/release.yml` |

## Work routing

Read this document before changing package boundaries, public exports, state ownership, persisted navigation, or generation dependencies. Update it with the corresponding source change. Keep exact implementation decisions with the owners above and release execution with the release workflow.
