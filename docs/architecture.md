# Architecture

This document owns the library and demonstration boundaries and their state relationships. The design follows the implemented source owners listed below. [Product](product.md) owns accepted capabilities and [UI design](ui-design.md) owns presentation. Exact command and package contracts stay in the manifests and configuration.

| Decision | Read |
| --- | --- |
| Change state or navigation | [Playback state](#playback-state) |
| Change package or demo builds | [Package boundaries](#package-boundaries) |
| Find an implementation owner | [Implementation owners](#implementation-owners) |

## Package boundaries

`packages/react-visual-novel` is the published browser package. Its ESM entry exports commands, components, contexts, types, and asset preloading directly from their source modules. Internal consumers import each behavior owner directly. Type declarations accompany the entry. `Branches` is an augmentation point for host-defined branch identifiers. Existing `dist/index.css` and `dist/index.js` imports remain supported through the package exports.

Tsdown bundles library source and leaves dependencies and peers external. Tailwind CSS 4 generates the library utility stylesheet separately, including utility theme variables without Preflight. The ESM bundle declares its client boundary and supports React 18 and 19. The library and demo import shared scrim CSS. The demo supplies the `rvn-*` component treatments in `demo/index.css` and compiles them with its local theme. The host application owns its component styling.

The demo consumes the workspace package through the same package entry used by installed consumers. It uses the Next.js App Router and default Turbopack bundler. A server layout imports the demo stylesheet, and a client boundary loads the browser-only game with server rendering disabled. The library writes native browser history so playback locations update without route fetches. Audio files are served from `demo/public/sounds/` through the asset module’s URL exports. Each mounted demo game owns reusable click and hover sound players, loads them on first playback, and unloads them during cleanup.

`mise.toml` owns runtime pins and `mise.lock` owns their platform resolutions. Root scripts prepare library output and Next declarations before checks and development. Next compiles demo CSS through PostCSS during development and builds. Generated output is disposable and excluded from source ownership.

The release workflow packages a checked version tag and passes its tarball to a separate npm publishing job. Trusted publisher and GitHub environment configuration must be verified before release delivery. The workflow owns exact runner permissions and commands. The [release runbook](runbooks/release.md) owns preparation, approval boundaries, failure recovery, and final package verification.

## Playback state

`GameContext` owns location, audio mute, pause, navigation, and host callbacks. The `location` query parameter reflects the selected branch and statement. The internal URL store observes native history writes and `popstate`, preserving other query parameters and fragments. Game writes pass fresh history state so router wrappers synchronize the URL and copy their own state. Its shared subscription wraps history methods while games are mounted and restores methods still owned by that subscription after the final game unmounts. Host wrappers remain in the call chain.

Local storage retains pause and location history under the existing keys. Pause subscribes to storage changes. History reads its initial persisted snapshot once and owns its mounted state. The history owner provides back navigation and resets. Navigation decisions compare destinations with the current history location, including calls made before React renders again. History mutations persist their snapshot and write the URL directly, and restoration compares the current browser URL with that history owner. Delayed effects do not restore an older render snapshot. Recovery replaces the current URL and resets history. An internal history context lets branch registration correct an out-of-range statement without adding a public navigation method. Local hooks own pause synchronization, committed callbacks, resize observation, and long-press timing.

`BranchContext` registers statements, measures the branch container, resolves labels, and advances playback. Its registration operation retains identity across focus and measurement updates. Equivalent behavior tuples retain command registration. Registration rejects duplicate labels before changing either lookup, and cleanup releases only entries owned by that registration. `Branch` normalizes fragments and labels into a contiguous statement sequence. Empty labels do not consume indices. `StatementContext` derives focus and visibility from the branch location and each command's hiding rule. `Command` connects statement registration to animation, timing, and audio playback. Playback callbacks and state refs update after commit. One visibility effect schedules audio entrances and exits, cancels superseded timers, and preserves the deferred entrance ordering. Mounted cleanup schedules the final exit separately.

Audio players are cached by source configuration. Commands resolve current sources through that cache. Each visibility operation captures its entrance or exit sound and tracks its current main sound. Main-source updates replace the tracked player. An entrance already in progress finishes before starting the latest main source. Visibility changes stop the players captured by the preceding operation, and retired operations cannot resume playback. Named audio channels coordinate interruption and overlap. Delayed stops belong to the playback request that scheduled them, so renewed playback supersedes an older stop. The audio owner notifies pending playback operations when their playing state changes. Asset preloading uses a local worker queue and reports progress and failure through the game render callback. Each preload operation owns its scheduled start, queue, and result updates. Replacing assets or unmounting cancels the scheduled start and retires the operation. In-flight requests can finish, but retired operations cannot claim more assets, update progress, or notify the host. Player controls derive readiness from the preload result. The vendor unmute helper supplies iOS audio behavior. Its retained source bytes stay outside lint and formatting.

## Trust and failure

Host assets, React children, and callbacks enter through public component contracts. Query parameters and browser storage are persisted inputs whose identifiers and keys must survive maintenance changes. Markdown text is rendered as React content rather than raw HTML. Unsupported syntax is reported by the parser owner.

The library requires browser APIs and host-supplied peers. The demo loads the game with server rendering disabled. Missing providers throw at the context hook boundary. Persisted pause and history values are decoded before use. Location indices must be nonnegative safe integers. `Game` supplies its branch identifiers to `GameProvider` for runtime branch validation. Standalone provider consumers can supply the optional branch registry. Branch registration resolves statement bounds after mounting. Invalid input falls back to a valid destination, and an unknown initial branch is an authoring error. Unavailable browser storage falls back to in-memory state. Asset failures are presented through the preload result. Browser playback and interaction are verified with developer-provided runtime evidence unless rendered evidence is explicitly requested.

## Implementation owners

| Contract | Owner |
| --- | --- |
| Public exports and augmentation | `packages/react-visual-novel/index.ts`, `types.ts`, `package.json` |
| Statement composition and player controls | `packages/react-visual-novel/components/` |
| Location, focus, visibility, and history | `packages/react-visual-novel/contexts/` |
| Audio and asset loading | `packages/react-visual-novel/lib/` |
| Command presentation and Markdown | `packages/react-visual-novel/commands/` |
| Bundle and CSS generation | `packages/react-visual-novel/tsdown.config.ts`, library and demo `index.css`, `demo/postcss.config.mjs`, workspace manifests |
| Demo routes and imported media | `demo/app/`, `demo/game/GamePlayer.tsx`, `demo/assets/`, `demo/public/`, `demo/next.config.ts` |
| Lint and formatting | `oxlint.config.ts`, `prettier.config.ts`, workspace TypeScript configs |
| Release delivery | `.github/workflows/release.yml`, `docs/runbooks/release.md` |

## Work routing

Read this document before changing package boundaries, public exports, state ownership, persisted navigation, or generation dependencies. Update it with the corresponding source change. Keep exact implementation decisions with the owners above and release execution with the release runbook and workflow.
