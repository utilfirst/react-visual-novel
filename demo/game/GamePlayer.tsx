"use client";

import dynamic from "next/dynamic";

// NOTE: The game and audio modules require browser APIs at import time.
const MyGame = dynamic(() => import("./MyGame.tsx"), { ssr: false });

export function GamePlayer() {
  return <MyGame />;
}
