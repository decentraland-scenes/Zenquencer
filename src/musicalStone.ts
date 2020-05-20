import utils from '../node_modules/decentraland-ecs-utils/index'
import { Carryable } from './carryable'

export const sceneMessageBus = new MessageBus()

export let stones: MusicalStone[] = []

// reusable stone class
export class MusicalStone extends Entity {
  note: number
  isClone: boolean = false

  constructor(
    shape: GLTFShape,
    transform: Transform,

    sound: AudioClip,
    note: number,
    isClone?: boolean
  ) {
    super()
    engine.addEntity(this)
    this.addComponent(shape)
    this.addComponent(transform)

    // note ID
    this.note = note

    // Sound
    this.addComponent(new AudioSource(sound))

    if (isClone) {
      this.isClone = isClone
      // Make carryable
      this.addComponent(new Carryable(transform.scale, note))
    }

    let thisStone = this

    if (isClone) {
      this.addComponent(
        new OnPointerDown(
          (e) => {
            if (e.buttonId == 0) {
              log('playing sound')
              sceneMessageBus.emit('noteOn', { note: thisStone.note })
            } else if (e.buttonId == 1) {
              log('carrying')
              let carryable = thisStone.getComponent(Carryable)
              carryable.toggleCarry(thisStone.getComponent(Transform))

              if (carryable.beingCarried) {
                thisStone.getComponent(OnPointerDown).hoverText = 'E drop'

                // messagebus: hide from others
              } else {
                thisStone.getComponent(OnPointerDown).hoverText =
                  'Click Play / E Carry'

                // messagebus: position for others
              }
            }
          },
          {
            hoverText: 'Click Play / E Carry',
          }
        )
      )
    } else {
      this.addComponent(
        new OnPointerDown(
          (e) => {
            if (e.buttonId == 0) {
              log('playing sound')
              sceneMessageBus.emit('noteOn', { note: thisStone.note })
            } else if (e.buttonId == 1) {
              thisStone.clone()
            }
          },
          {
            hoverText: 'Click Play / E Carry',
          }
        )
      )
    }
  }
  public play(): void {
    this.getComponent(AudioSource).playOnce()

    // animate
  }

  public clone(): void {
    const clone = new MusicalStone(
      this.getComponent(GLTFShape),
      new Transform({
        position: this.getComponent(Transform).position.clone(),
        scale: new Vector3(0.5, 0.5, 0.5),
        rotation: this.getComponent(Transform).rotation,
      }),
      this.getComponent(AudioSource).audioClip,
      stones.length,
      true
    )
    stones.push(clone)

    let carryable = clone.getComponent(Carryable)
    carryable.toggleCarry(clone.getComponent(Transform))

    clone.getComponent(OnPointerDown).hoverText = 'E drop'

    // messagebus add to stones array
  }
}

sceneMessageBus.on('noteOn', (e) => {
  stones[e.note].play()

  // ignore if comes from sequencer from other player
})

sceneMessageBus.on('seqOn', (e) => {})

sceneMessageBus.on('seqOff', (e) => {})
