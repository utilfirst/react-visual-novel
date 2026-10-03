import { GamePlayer } from "#game/GamePlayer.tsx";
import { Suspense } from "react";

export default function PlayPage() {
  return (
    <main className="h-screen w-screen">
      <Suspense fallback={null}>
        <GamePlayer />
      </Suspense>
    </main>
  );
}
