import {bgSolidJpg, clickMp3, mouseoverMp3} from 'assets'
import * as assets from 'assets'
import {Howl} from 'howler'
import {Branch, Game, prepareBranches, Say, Scene} from 'react-visual-novel'

function BranchIntro() {
  return (
    <Branch>
      <Scene src={bgSolidJpg.src} />
      <Say>Hello, world!</Say>
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
    <>
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
      />
    </>
  )
}

function playAudio(src: string) {
  new Howl({src}).play()
}
