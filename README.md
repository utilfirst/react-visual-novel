# react-visual-novel

react-visual-novel is a browser React library for composing visual novels from branches and commands.

The workspace contains the published library in `packages/react-visual-novel` and its Next.js demonstration in `demo`. Product, architecture, and UI design documents describe capabilities, package relationships, and shared presentation.

[![Latest release](https://img.shields.io/npm/v/react-visual-novel.svg)](https://www.npmjs.org/package/react-visual-novel) [![License](https://img.shields.io/npm/l/react-visual-novel.svg)](https://www.npmjs.org/package/react-visual-novel)

## Installation

Use React 18 and install the audio and query parameter peers:

```shell
npm install react-visual-novel howler use-query-params
```

## Quickstart

Wrap the game with the host application's `QueryParamProvider`, then compose branches and commands. The workspace demo shows the Next.js Pages Router adapter in `demo/pages/_app.tsx`.

```tsx
import * as assets from "./assets/index.ts";
import { bgSolidJpg } from "./assets/index.ts";
import { Branch, Game, prepareBranches, Say, Scene } from "react-visual-novel";
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

type MyBranches = typeof branches;
declare module "react-visual-novel" {
  interface Branches extends MyBranches {}
}

export default function MyGame() {
  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <Game assets={assets} branches={branches} initialBranchId="Intro" />
    </div>
  );
}
```

## Start

Install [Mise](https://mise.jdx.dev/), then run:

```shell
mise install --locked
pnpm install --frozen-lockfile
pnpm run dev
```

Runtime pins live in `mise.toml`. Read [Product](docs/product.md) for capabilities, [Architecture](docs/architecture.md) for package and state boundaries, [UI design](docs/ui-design.md) for presentation, and AGENTS.md for maintenance commands.

## Release

The release workflow checks and packages version tags matching the library manifest, then publishes the checked tarball through npm trusted publishing. Update the library manifest version before creating its `v<version>` tag. Before pushing a release tag, configure the package's npm trusted publisher for this repository, workflow `release.yml`, and GitHub environment `release`. Provider configuration and tag pushes require separate approval. [npm's trusted publishing guide](https://docs.npmjs.com/trusted-publishers/) owns the setup requirements.

## License

[MIT License](./LICENSE) © Utility First
