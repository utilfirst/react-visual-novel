# UI design

This document owns the shared visual and interaction grammar for the player and its demonstration. [Product](product.md) owns capabilities and [Architecture](architecture.md) owns state. Component source and `demo/index.css` own exact presentation values.

| Decision                    | Read                                |
| --------------------------- | ----------------------------------- |
| Change command presentation | [Commands](#commands)               |
| Change player interaction   | [Player controls](#player-controls) |
| Change styling integration  | [Style ownership](#style-ownership) |

## Commands

Commands share a full-container stage with entrance and exit animations. Scenes cover the stage. Image and text overlays preserve their command order. Timed statements show progress at the top edge. Text and menus support top, middle, and bottom placement and a command color scheme.

Dialogue reveals characters in sequence. Markdown links retain their link semantics. Choices render as buttons, including frame-positioned choices. Frame positions scale relative to the measured branch container. The source-provided frame coordinates remain the placement authority.

## Player controls

The player places navigation and playback controls above command content. Click-to-advance, keyboard advancement with Enter or Space, long-press pause, history navigation, and explicit choices share branch state. Progress pauses while the game is paused or the window loses focus. Controls expose accessible names without adding visible text to the icon treatment.

## Style ownership

The library's Tailwind utilities and `rvn-*` class names are the host styling contract. Shared scrim CSS supplies dialogue shading. Player controls use SVG icons with accessible names on their buttons. The demo defines its component treatments, script font, gentle bounce animation, monochrome control palette, loading progress, and error treatment in `demo/index.css`, including its Tailwind CSS 4 theme. The library stylesheet omits Preflight so host reset styles remain host-owned. Preserve the component treatments when updating utilities.

## Maintenance

Update this document when shared stage composition, command placement, playback feedback, player interactions, or host style ownership changes. Keep exact CSS, animation values, and component props with their source owners.
