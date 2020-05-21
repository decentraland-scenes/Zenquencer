//import utils from '../node_modules/decentraland-ecs-utils/index'

import { seqNumbers } from './serverHandler'
import { plates } from './basePlate'

export const sceneMessageBus = new MessageBus()

export let stones: MusicalStone[] = []

// reusable stone class
export class MusicalStone extends Entity {
  note: number
  shape: GLTFShape

  constructor(
    shape: GLTFShape,
    transform: Transform,

    sound: AudioClip,
    note: number
  ) {
    super()
    engine.addEntity(this)
    //this.addComponent(shape)
    this.addComponent(transform)

    // note ID
    this.note = note

    this.shape = shape

    // Sound
    this.addComponent(new AudioSource(sound))

    let thisStone = this

    this.addComponent(
      new OnPointerDown(
        (e) => {
          log('playing sound')
          sceneMessageBus.emit('playStone', { note: thisStone.note })
        },
        {
          button: ActionButton.POINTER,
          hoverText: 'Click Play / E Carry',
        }
      )
    )
  }
  public play(): void {
    this.getComponent(AudioSource).playOnce()

    // animate
  }
}

sceneMessageBus.on('playStone', (e) => {
  stones[e.note].play()

  // ignore if comes from sequencer from other player
})

sceneMessageBus.on('seqOn', (e) => {
  sequencePlaying = true
})

sceneMessageBus.on('seqOff', (e) => {
  sequencePlaying = false
})

let sequencePlaying: boolean = false

// check server for new messageboard messages
export class PlaySequence implements ISystem {
  loopDuration: number
  intervals: number
  currentInterval: number
  currentLoop: number
  intervalDuration: number
  //totalMessageTime: number
  constructor(loopDuration: number, intervals: number) {
    this.loopDuration = loopDuration
    this.intervals = intervals
    this.currentLoop = 0
    this.currentInterval = 0
    this.intervalDuration = this.loopDuration / this.intervals
  }
  update(dt: number) {
    if (!sequencePlaying) {
      return
    }
    this.currentLoop += dt

    if (this.currentLoop >= this.currentInterval * this.intervalDuration) {
      this.currentInterval += 1
      if (this.currentInterval >= this.intervals) {
        this.currentLoop = 0
        this.currentInterval = 0
        log('new loop')
      }
      for (let i = 0; i < 7; i++) {
        if (seqNumbers[this.currentInterval][i]) {
          plates[this.currentInterval * 7 + i].stone.play()
        }
      }
    }
  }
}

engine.addSystem(new PlaySequence(4, 16))

let toggleSeq = new Entity()
toggleSeq.addComponent(new Transform({ position: new Vector3(2, 1, 2) }))
toggleSeq.addComponent(new BoxShape())
engine.addEntity(toggleSeq)
toggleSeq.addComponent(
  new OnPointerDown(() => {
    if (sequencePlaying) {
      sceneMessageBus.emit('seqOff', {})
    } else {
      sceneMessageBus.emit('seqOn', {})
    }
  })
)
