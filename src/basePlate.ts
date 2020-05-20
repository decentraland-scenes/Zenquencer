//import utils from '../node_modules/decentraland-ecs-utils/index'
import { MusicalStone, stones } from './musicalStone'
import resources from './resources'

export const sceneMessageBus = new MessageBus()

export let plates: BasePlate[] = []

// reusable stone class
export class BasePlate extends Entity {
  sound: AudioClip
  index: number
  stoneOn: boolean = false
  stone: MusicalStone
  constructor(
    shape: GLTFShape,
    transform: Transform,
    sound: AudioClip,
    index: number
  ) {
    super()
    engine.addEntity(this)
    this.addComponent(shape)
    this.addComponent(transform)

    // note ID
    this.sound = sound

    this.index = index

    let thisPlate = this

    this.addComponent(
      new OnPointerDown(
        (e) => {
          log('toggle stone')
          if (this.stoneOn) {
            sceneMessageBus.emit('hideStone', { plate: thisPlate.index })
          } else {
            sceneMessageBus.emit('showStone', { plate: thisPlate.index })
          }
        },
        {
          button: ActionButton.POINTER,
          hoverText: 'Click Play / E Carry',
        }
      )
    )

    this.stone = new MusicalStone(
      new GLTFShape('models/SpiralStone_01/SpiralStone_01.glb'),
      new Transform({
        position: new Vector3(0, 1, 0),
      }),
      this.sound,
      this.index
    )
    this.stone.setParent(this)
    this.stone.getComponent(GLTFShape).visible = false
    stones.push(this.stone)
  }
}

sceneMessageBus.on('showStone', (e) => {
  plates[e.plate].stoneOn = true

  plates[e.plate].stone.getComponent(GLTFShape).visible = true
})

sceneMessageBus.on('hideStone', (e) => {
  plates[e.plate].stoneOn = false

  plates[e.plate].stone.getComponent(GLTFShape).visible = false
})