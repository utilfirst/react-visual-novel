# Provenance

This log retains adopted external sources and their exclusions. Recorded paths and revisions are historical identifiers. Current ownership is described in `AGENTS.md`, `docs/architecture.md`, and repository configuration.

## 2026-10-03

### Inlined dependency behavior

The installed `@react-hookz/web@16.0.0`, `use-event-callback@0.1.0`, `use-long-press@3.3.0`, `intrinsic-scale@3.0.4`, `string-dedent@3.0.2`, `micro-observables@1.7.2`, `moize@6.1.3`, and `@supercharge/promise-pool@2.3.2` implementations provide the behavior comparison sources for local playback utilities. The replacements cover the operations used by the library. General hook options, template-tag dedenting, observable derivation, and configurable memoization are excluded. Source inspection and temporary callback and equivalence checks establish the recorded comparison scope. Browser playback remains outside that evidence.

`daisyui@2.52.0` supplies the retained monochrome palette, button dimensions, focus treatment, progress treatment, and error colors. `tailwindcss-scrims@1.0.0` supplies the retained four dialogue gradients. Local CSS and Tailwind configuration own those treatments. The general component catalog, theme selector, and unused scrim directions are excluded. Player icons retain `phosphor-react@1.4.1`. Icon rendering is excluded from the local replacements.

### Repository modernization reference

The modernization uses `/Users/yenbekbay/Developer/utilfirst-eslint-plugin` at revision `a240a8b5b6d03e1e9a08ff4ccdb6031348b23bb1` as the reference for runtime pinning, canonical lint commands, Oxlint base configuration, formatter plugins, and editor settings. Its `mise.lock` resolutions are reused for the identical runtime pins and supported platforms. This record identifies the source. Repository manifests and configuration own the adopted behavior.

The reference's plugin-specific rule development, test harness, package identity, and release notes tooling are excluded. The visual novel workspace retains its browser library, React peer contract, CSS entry, declaration merging, and Pages Router demonstration. Registry publication dates constrain dependency adoption independently of the reference revision.

### Retained vendor sources

`packages/react-visual-novel/contexts/internal/vendor/unmute.js` retains the audio compatibility helper from `https://github.com/swevans/unmute`. The child-flattening implementation in `packages/react-visual-novel/components/Branch.tsx` derives from `https://github.com/grrowl/react-keyed-flatten-children`. The idle callback fallback in `packages/react-visual-novel/lib/use-preload-assets.ts` derives from the requestIdleCallback guidance at `https://developers.google.com/web/updates/2015/08/using-requestidlecallback`.
