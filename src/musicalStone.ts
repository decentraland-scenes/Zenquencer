//import utils from '../node_modules/decentraland-ecs-utils/index'

export const sceneMessageBus = new MessageBus()

export let seqNumbers: number[][] = []

export let stones: MusicalStone[] = []

// reusable stone class
export class MusicalStone extends Entity {
  note: number

  constructor(
    shape: GLTFShape,
    transform: Transform,

    sound: AudioClip,
    note: number
  ) {
    super()
    engine.addEntity(this)
    this.addComponent(shape)
    this.addComponent(transform)

    // note ID
    this.note = note

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

sceneMessageBus.on('seqOn', (e) => {})

sceneMessageBus.on('seqOff', (e) => {})
