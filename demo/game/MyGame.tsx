import * as assets from "#assets/index.ts";
import { bgSolidJpg, clickMp3, mouseoverMp3 } from "#assets/index.ts";
import { Howl } from "howler";
import { Branch, Game, prepareBranches, Say, Scene } from "react-visual-novel";

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
  // oxlint-disable-next-line typescript/consistent-type-definitions, typescript/no-empty-object-type -- This declaration augments the library branch registry.
  interface Branches extends MyBranches {}
}

export default function MyGame() {
  return (
    <div className="flex h-screen w-screen">
      <Game
        assets={assets}
        branches={branches}
        initialBranchId="Intro"
        onPlaySound={(sound) => {
          switch (sound) {
            case "click": {
              playAudio(clickMp3);
              break;
            }
            case "mouseover": {
              playAudio(mouseoverMp3);
              break;
            }
            case "skip":
            case "not_allowed": {
              break;
            }
          }
        }}
      >
        {(render, res, progress) => {
          if (res.status === "loading") {
            return (
              <div className="flex h-full w-full flex-col justify-center gap-4 p-8">
                <h1 className="text-center text-xl/7 font-bold text-balance">
                  Loading…
                </h1>

                <progress
                  value={progress * 100}
                  max={100}
                  className="rvn-preload-progress"
                />
              </div>
            );
          }
          if (res.status === "failure") {
            return (
              <div className="flex h-full w-full flex-col justify-center gap-4 p-8">
                <h1 className="text-xl/7 font-bold text-balance">
                  Unable to preload assets
                </h1>

                <pre className="w-full rounded-sm bg-error p-4 font-mono text-sm/6 whitespace-pre-line text-error-content">
                  {res.error.message}
                </pre>
              </div>
            );
          }

          return <div className="flex h-full w-full flex-col">{render()}</div>;
        }}
      </Game>
    </div>
  );
}

function playAudio(src: string) {
  new Howl({ src }).play();
}
