import { seqNumbers } from './stones'
import { stones } from './stones'
import resources from './resources'

export const sceneMessageBus = new MessageBus()

const loopDuration = 60

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
  loopPlayer.durationLeft = loopDuration
  linear.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
  random.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
  neutral.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
  energyAnimation.stop()
  energyAnimation.play()
})

sceneMessageBus.on('randomMode', (e) => {
  loopPlayer.playingMode = 2
  loopPlayer.currentBeat = -1
  loopPlayer.durationLeft = loopDuration
  random.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
  linear.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
  neutral.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
  energyAnimation.stop()
  energyAnimation.play()
})

sceneMessageBus.on('seqOff', (e) => {
  loopPlayer.playingMode = 0
  linear.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
  random.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
  neutral.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
})

// system to play the loop continuously
export class PlaySequence implements ISystem {
  playingMode: number // 0 = off, 1 = loop, 2 = random
  currentBeat: number
  loopDuration: number
  durationLeft: number
  beats: number
  currentLoop: number
  beatDuration: number
  constructor(loopDuration: number, totalDuration: number, beats: number) {
    this.durationLeft = totalDuration
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

    this.durationLeft -= dt
    if (this.durationLeft < 0) {
      this.playingMode = 0
      energyAnimation.stop()
      linear.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
      random.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
    }
    this.currentLoop += dt
    if (this.currentLoop >= this.currentBeat * this.beatDuration) {
      this.currentBeat += 1
      if (this.currentBeat >= this.beats) {
        this.currentLoop = 0
        this.currentBeat = 0

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

// start loop, w 8 second loops and with 16 beats
export let loopPlayer = new PlaySequence(8, loopDuration, 16)
engine.addSystem(loopPlayer)

///// Buttons
let tube = new Entity()
tube.addComponent(
  new Transform({
    position: new Vector3(8, 0, 11.5),
    rotation: Quaternion.Euler(0, 270, 0),
  })
)
let energyAnimation = new AnimationState('Energy_Action', { looping: false })
tube.addComponent(new Animator()).addClip(energyAnimation)
tube.addComponent(resources.models.tube)
engine.addEntity(tube)

let linear = new Entity()
linear.addComponent(
  new Transform({
    position: new Vector3(-9.54, 1.48, 4.59),
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
    position: new Vector3(-9.54, 1.49, 4.33),
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

let slow2 = new Entity()
slow2.addComponent(
  new Transform({
    position: new Vector3(-9.54, 1.6, 4.59),
    rotation: Quaternion.Euler(0, 180, 0),
  })
)
slow2.addComponent(resources.models.speedButton)
slow2.setParent(tube)
engine.addEntity(slow2)
slow2.addComponent(
  new OnPointerDown(
    () => {
      sceneMessageBus.emit('seqSpeed', { speed: 12 })
    },
    { hoverText: 'Very Slow' }
  )
)

let slow1 = new Entity()
slow1.addComponent(
  new Transform({
    position: new Vector3(-9.54, 1.6, 4.53),
    rotation: Quaternion.Euler(0, 180, 0),
  })
)
slow1.addComponent(resources.models.speedButton)
slow1.setParent(tube)
engine.addEntity(slow1)
slow1.addComponent(
  new OnPointerDown(
    () => {
      sceneMessageBus.emit('seqSpeed', { speed: 8 })
    },
    { hoverText: 'Slow' }
  )
)

let neutral = new Entity()
neutral.addComponent(
  new Transform({
    position: new Vector3(-9.54, 1.6, 4.47),
    rotation: Quaternion.Euler(0, 180, 0),
  })
)
neutral.addComponent(resources.models.speedButton)
neutral.setParent(tube)
engine.addEntity(neutral)
neutral.addComponent(
  new OnPointerDown(
    () => {
      sceneMessageBus.emit('seqSpeed', { speed: 4 })
    },
    { hoverText: 'Normal' }
  )
)

let fast1 = new Entity()
fast1.addComponent(
  new Transform({
    position: new Vector3(-9.54, 1.6, 4.41),
    rotation: Quaternion.Euler(0, 180, 0),
  })
)
fast1.addComponent(resources.models.speedButton)
fast1.setParent(tube)
engine.addEntity(fast1)
fast1.addComponent(
  new OnPointerDown(
    () => {
      sceneMessageBus.emit('seqSpeed', { speed: 2 })
    },
    { hoverText: 'Fast' }
  )
)

let fast2 = new Entity()
fast2.addComponent(
  new Transform({
    position: new Vector3(-9.54, 1.6, 4.35),
    rotation: Quaternion.Euler(0, 180, 0),
  })
)
fast2.addComponent(resources.models.speedButton)
fast2.setParent(tube)
engine.addEntity(fast2)
fast2.addComponent(
  new OnPointerDown(
    () => {
      sceneMessageBus.emit('seqSpeed', { speed: 1 })
    },
    { hoverText: 'Very Fast' }
  )
)

sceneMessageBus.on('seqSpeed', (e) => {
  if (loopPlayer.playingMode) {
    let newSpeed = e.speed * 4

    log('new duration = ', newSpeed)
    loopPlayer.loopDuration = newSpeed
    loopPlayer.beatDuration = loopPlayer.loopDuration / loopPlayer.beats
    loopPlayer.currentLoop = loopPlayer.currentBeat * loopPlayer.beatDuration

    switch (e.speed) {
      case 12:
        slow2.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        slow1.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        neutral.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        fast1.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        fast2.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        break
      case 8:
        slow2.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        slow1.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        neutral.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        fast1.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        fast2.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        break
      case 4:
        slow2.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        slow1.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        neutral.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        fast1.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        fast2.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        break
      case 2:
        slow2.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        slow1.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        neutral.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        fast1.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        fast2.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        break
      case 1:
        slow2.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        slow1.getComponent(Transform).rotation = Quaternion.Euler(0, 180, 0)
        neutral.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        fast1.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        fast2.getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)
        break
    }
  } else {
    sceneMessageBus.emit('seqOn', {})
  }
})
