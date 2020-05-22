import { seqNumbers } from './serverHandler'
import { stones } from './stones'
import resources from './resources'

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
  loopPlayer.playingMode = 1
  loopPlayer.currentBeat = -1
  linear.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
  random.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
})

sceneMessageBus.on('randomMode', (e) => {
  loopPlayer.playingMode = 2
  loopPlayer.currentBeat = -1
  random.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
  linear.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
})

sceneMessageBus.on('seqOff', (e) => {
  loopPlayer.playingMode = 0
  linear.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
  random.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
})

// system to play the loop continuously
export class PlaySequence implements ISystem {
  playingMode: number // 0 = off, 1 = loop, 2 = random
  currentBeat: number
  loopDuration: number
  loopsLeft: number
  beats: number
  currentLoop: number
  beatDuration: number
  constructor(loopDuration: number, loops: number, beats: number) {
    this.loopsLeft = loops
    this.loopDuration = loopDuration
    this.beats = beats
    this.currentLoop = 0
    this.currentBeat = 0
    this.beatDuration = this.loopDuration / this.beats
  }
  update(dt: number) {
    if (!this.playingMode) {
      return
    }
    this.currentLoop += dt

    if (this.currentLoop >= this.currentBeat * this.beatDuration) {
      this.currentBeat += 1
      if (this.currentBeat >= this.beats) {
        this.currentLoop = 0
        this.currentBeat = 0
        this.loopsLeft -= 1
        if (this.loopsLeft < 0) {
          this.playingMode = 0
          linear.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
          random.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        }
        log('new loop')
      }
      if (this.playingMode == 1) {
        // sequence mode
        for (let i = 0; i < 7; i++) {
          if (seqNumbers[this.currentBeat][i]) {
            stones[this.currentBeat * 7 + i].drop.play()
          }
        }
      } else {
        // random mode
        let randomBeat = Math.floor(Math.random() * this.beats)
        for (let i = 0; i < 7; i++) {
          if (seqNumbers[randomBeat][i]) {
            stones[randomBeat * 7 + i].drop.play()
          }
        }
      }
    }
  }
}

// start loop, lasting 4 seconds and with 16 beats
export let loopPlayer = new PlaySequence(4, 16, 16)
engine.addSystem(loopPlayer)

///// Buttons
let tube = new Entity()
tube.addComponent(
  new Transform({
    position: new Vector3(8, 0, 11.5),
    rotation: Quaternion.Euler(0, 270, 0),
  })
)
tube.addComponent(resources.models.tube)
engine.addEntity(tube)

let linear = new Entity()
linear.addComponent(
  new Transform({
    position: new Vector3(-9.54, 1.5, 4.6),
    rotation: Quaternion.Euler(0, 180, 0),
  })
)
linear.addComponent(resources.models.linearButton)
linear.setParent(tube)
engine.addEntity(linear)
linear.addComponent(
  new OnPointerDown(
    () => {
      sceneMessageBus.emit('seqOn', {})
    },
    { hoverText: 'Loop' }
  )
)

let random = new Entity()
random.addComponent(
  new Transform({
    position: new Vector3(-9.54, 1.5, 4.3),
    rotation: Quaternion.Euler(0, 180, 0),
  })
)
random.addComponent(resources.models.randomButton)
engine.addEntity(random)
random.setParent(tube)
random.addComponent(
  new OnPointerDown(
    () => {
      sceneMessageBus.emit('randomMode', {})
    },
    { hoverText: 'Random' }
  )
)

let fast = new Entity()
fast.addComponent(new Transform({ position: new Vector3(2, 1, 6) }))
fast.addComponent(new BoxShape())
engine.addEntity(fast)
fast.addComponent(
  new OnPointerDown(
    () => {
      if (loopPlayer.playingMode) {
        let newDuration = Math.max(loopPlayer.loopDuration / 2, 2)
        log('new duration = ', newDuration)
        loopPlayer.loopDuration = newDuration
        loopPlayer.beatDuration = loopPlayer.loopDuration / loopPlayer.beats
      }
    },
    { hoverText: 'Faster' }
  )
)

let slow = new Entity()
slow.addComponent(new Transform({ position: new Vector3(2, 1, 8) }))
slow.addComponent(new BoxShape())
engine.addEntity(slow)
slow.addComponent(
  new OnPointerDown(
    () => {
      if (loopPlayer.playingMode) {
        let newDuration = Math.min(loopPlayer.loopDuration * 2, 16)
        log('new duration = ', newDuration)
        loopPlayer.loopDuration = newDuration
        loopPlayer.beatDuration = loopPlayer.loopDuration / loopPlayer.beats
      }
    },
    { hoverText: 'Slower' }
  )
)
