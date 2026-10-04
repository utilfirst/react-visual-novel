# react-visual-novel

react-visual-novel is a browser React library for composing visual novels from branches and commands.

The workspace contains the published library in `packages/react-visual-novel` and its Next.js demonstration in `demo`. Product, architecture, and UI design documents describe capabilities, package relationships, and shared presentation.

[![Latest release](https://img.shields.io/npm/v/react-visual-novel.svg)](https://www.npmjs.org/package/react-visual-novel) [![License](https://img.shields.io/npm/l/react-visual-novel.svg)](https://www.npmjs.org/package/react-visual-novel)

## Installation

Use React 18 or 19 and install the audio and animation peers:

```shell
npm install react-visual-novel howler framer-motion
```

## Quickstart

Compose branches and commands directly. The game synchronizes its `location` query parameter with browser history without a query provider. The workspace demo shows App Router integration in `demo/game/GamePlayer.tsx`. For Next.js App Router, keep the browser-only game behind a Client Component with `dynamic(..., { ssr: false })`.

```tsx
import * as assets from "./assets/index.ts";
import { bgSolidJpg } from "./assets/index.ts";
import { Branch, createGame, prepareBranches, Scene } from "react-visual-novel";
import "react-visual-novel/dist/index.css";

function BranchIntro() {
  return (
    <Branch>
      <Scene src={bgSolidJpg.src} />
      <Say>Welcome to react-visual-novel!</Say>
    </Branch>
  );
}

const branches = prepareBranches({ BranchIntro });

const { Game, Say } = createGame<keyof typeof branches>();

export default function MyGame() {
  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <Game assets={assets} branches={branches} initialBranchId="Intro" />
    </div>
  );
}
```

`createGame` scopes choice callbacks and navigation hooks to one game without global declarations. Existing `Branches` declaration merging remains supported. Name reusable destinations with `GameLocation<keyof typeof branches>` and pass them to `goToLocation(location)`. Positional `goToLocation(branchId, statementIndex)` calls retain their meaning. The host and library share the installed Motion peer so custom command animation controls use one implementation.

The generated stylesheet uses Tailwind CSS 4 and requires Safari 16.4+, Chrome 111+, and Firefox 128+. It supplies utilities and shared scrims without a global reset. Host applications supply the `rvn-*` component treatments shown in `demo/index.css`.

## Start

Install [Mise](https://mise.jdx.dev/), then run:

```shell
mise install --locked
pnpm install --frozen-lockfile
pnpm run dev
```

Runtime pins live in `mise.toml`. Read [Product](docs/product.md) for capabilities, [Architecture](docs/architecture.md) for package and state boundaries, [UI design](docs/ui-design.md) for presentation, and AGENTS.md for maintenance commands.

## Release

The release workflow checks and packages version tags matching the library manifest, then publishes the checked tarball through npm trusted publishing. Read the [release runbook](docs/runbooks/release.md) before preparing a version, pushing a release tag, or publishing a package.

## License

[MIT License](./LICENSE) © Utility First
