import { seqNumbers } from './serverHandler'
import { stones } from './stones'

export const sceneMessageBus = new MessageBus()

export let drops: MusicalDrop[] = []

// reusable stone class
export class MusicalDrop extends Entity {
  note: number
  shape: GLTFShape
  anim: AnimationState

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

    // store shape to add to entity later
    this.shape = shape

    // Sound
    this.addComponent(new AudioSource(sound))

    this.anim = new AnimationState('ArmatureAction.001', { looping: false })

    this.addComponent(new Animator()).addClip(this.anim)

    // needed to reference the entity from inside a component, because `this` in there refers to the component
    let thisStone = this

    // this.addComponent(
    //   new OnPointerDown(
    //     (e) => {
    //       log('playing sound')
    //       sceneMessageBus.emit('playStone', { note: thisStone.note })
    //     },
    //     {
    //       button: ActionButton.POINTER,
    //       hoverText: 'Play',
    //     }
    //   )
    // )
  }
  public play(): void {
    this.getComponent(AudioSource).playOnce()
    this.anim.stop()
    this.anim.play()

    // animate
  }
}

// pick up message bus events, from you and other players
sceneMessageBus.on('playStone', (e) => {
  drops[e.note].play()
})

sceneMessageBus.on('seqOn', (e) => {
  sequencePlaying = true
  loopPlayer.currentBeat = -1
})

sceneMessageBus.on('seqOff', (e) => {
  sequencePlaying = false
})

// flag to turn loop on or off
export let sequencePlaying: boolean = false

// system to play the loop continuously
export class PlaySequence implements ISystem {
  currentBeat: number
  loopDuration: number
  beats: number
  currentLoop: number
  beatDuration: number
  constructor(loopDuration: number, beats: number) {
    this.loopDuration = loopDuration
    this.beats = beats
    this.currentLoop = 0
    this.currentBeat = 0
    this.beatDuration = this.loopDuration / this.beats
  }
  update(dt: number) {
    if (!sequencePlaying) {
      return
    }
    this.currentLoop += dt

    if (this.currentLoop >= this.currentBeat * this.beatDuration) {
      this.currentBeat += 1
      if (this.currentBeat >= this.beats) {
        this.currentLoop = 0
        this.currentBeat = 0
        log('new loop')
      }
      for (let i = 0; i < 7; i++) {
        if (seqNumbers[this.currentBeat][i]) {
          stones[this.currentBeat * 7 + i].drop.play()
        }
      }
    }
  }
}

// start loop, lasting 4 seconds and with 16 beats
export let loopPlayer = new PlaySequence(4, 16)
engine.addSystem(loopPlayer)

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
