# Product

react-visual-novel lets authors compose browser visual novels from React components. This document owns the capability boundary. [Architecture](architecture.md) owns state and package relationships. [UI design](ui-design.md) owns shared presentation.

| Decision               | Read                    |
| ---------------------- | ----------------------- |
| Compose a visual novel | [Authoring](#authoring) |
| Change player behavior | [Playback](#playback)   |

## Authoring

Authors provide named branches, assets, and an initial branch to `Game`. `prepareBranches` derives branch identifiers from component names beginning with `Branch`. The `Branches` interface supports declaration merging so branch destinations can be checked in author code.

Branches contain commands for scenes, images, dialogue, titles, audio, and choices. Labels name statement destinations. Empty labels contribute no statements. Choice callbacks can change branches, jump to a statement, or advance playback. Custom commands can read the same navigation operations through `useNavigation` and type their callbacks with `Navigation`. `CommandSurface` supplies an animated container for custom command content. The command components and their exported types own the exact props.

## Playback

The player preloads supplied assets and exposes loading progress and failure to its render callback. Commands expose timed, manually skippable, and non-skippable behavior. Zero-duration commands advance without a progress countdown and respect pause and focus. Updating a visible command's main audio source replaces that sound. Updated entrance and exit sources apply at the next corresponding visibility transition. Player controls mute audio, pause timed progression, revisit history, restart the initial branch, and invoke an optional home action. Link and sound callbacks let the host application supply their effects.

Playback locations support shareable URLs and browser back/forward navigation without a host query provider. Malformed locations and unknown branches fall back to the initial branch. A statement index outside the selected branch resets to its first registered statement. History resets discard invalid destinations.

The demonstration in `demo/game/MyGame.tsx` exercises the package through its published entry and generated stylesheet.

## Maintenance

Update this document when accepted authoring capabilities, navigation behavior, player controls, or host integration requirements change. Keep exact prop shapes in their source modules.
