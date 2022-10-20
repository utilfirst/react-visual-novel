# react-visual-novel

[![Latest release](https://img.shields.io/npm/v/react-visual-novel.svg)](https://www.npmjs.org/package/react-visual-novel)
[![License](https://img.shields.io/npm/l/react-visual-novel.svg)](https://www.npmjs.org/package/react-visual-novel)

Build visual novels using web technologies. Powered by [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), and [howler.js](https://github.com/goldfire/howler.js).

## Installation

This package requires some peer dependencies, which you need to install by yourself.

```shell
npm install react-visual-novel howler use-query-params
```

## Quickstart

This is only a very basic usage example of react-visual-novel. To see everything that is possible with the library, please refer to a [production demo](https://github.com/yenbekbay/archcode-heritage-novel).

```tsx
import * as assets from 'assets'
import {bgSolidJpg} from 'assets'
import {Branch, Game, prepareBranches, Say, Scene} from 'react-visual-novel'
import 'react-visual-novel/dist/index.css'

function BranchIntro() {
  return (
    <Branch>
      <Scene src={bgSolidJpg.src} />
      <Say>Welcome to react-visual-novel!</Say>
    </Branch>
  )
}

const branches = prepareBranches({BranchIntro})

type MyBranches = typeof branches
declare module 'react-visual-novel' {
  interface Branches extends MyBranches {}
}

export default function MyGame() {
  return (
    <div style={{display: 'flex', width: '100vw', height: '100vh'}}>
      <Game assets={assets} branches={branches} initialBranchId="Intro" />
    </div>
  )
}
```

## Development

Before you can start developing, please make sure that you have pnpm installed (`npm install -g pnpm`). Then install the dependencies using pnpm: `pnpm install`.

For local development, you can use `pnpm dev`.

## License

[MIT License](./LICENSE) © Utility First
