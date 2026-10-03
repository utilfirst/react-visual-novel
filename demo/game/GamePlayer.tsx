"use client";

import dynamic from "next/dynamic";
import { QueryParamProvider } from "use-query-params";
import { QueryParamAdapter } from "./QueryParamAdapter.tsx";

// NOTE: The game and audio modules require browser APIs at import time.
const MyGame = dynamic(() => import("./MyGame.tsx"), { ssr: false });

export function GamePlayer() {
  return (
    <QueryParamProvider adapter={QueryParamAdapter}>
      <MyGame />
    </QueryParamProvider>
  );
}
