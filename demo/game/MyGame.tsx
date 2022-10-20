import * as assets from 'assets'
import {bgSolidJpg, clickMp3, mouseoverMp3} from 'assets'
import {Howl} from 'howler'
import {Branch, Game, prepareBranches, Say, Scene} from 'react-visual-novel'

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
    <Game
      assets={assets}
      branches={branches}
      initialBranchId="Intro"
      onGoToRoot={() => {
        console.log('onGoToRoot')
      }}
      onLinkClick={(href, name, event) => {
        console.log('onLinkClick', {href, name, event})
      }}
      onPlaySound={(sound) => {
        switch (sound) {
          case 'click':
            playAudio(clickMp3)
            break
          case 'mouseover':
            playAudio(mouseoverMp3)
            break
        }
      }}
    >
      {(render, res, progress) => {
        if (res.status === 'loading') {
          return (
            <div className="prose flex h-screen w-screen max-w-none flex-col justify-center bg-base-100 p-8">
              <h1 className="text-center">Loading…</h1>
              <progress
                value={progress * 100}
                max={100}
                className="progress w-full"
              />
            </div>
          )
        }
        if (res.status === 'failure') {
          return (
            <div className="prose flex h-screen w-screen max-w-none flex-col justify-center bg-base-100 p-8">
              <h1>Unable to preload assets</h1>

              <pre className="alert alert-error items-start whitespace-pre-line font-mono">
                {res.error.message}
              </pre>
            </div>
          )
        }
        return (
          <div className="flex h-screen w-screen flex-col bg-base-100">
            {render()}
          </div>
        )
      }}
    </Game>
  )
}

function playAudio(src: string) {
  new Howl({src}).play()
}
