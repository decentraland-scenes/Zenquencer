import utils from '../node_modules/decentraland-ecs-utils/index'
import { MusicalStone, stones } from './musicalStone'
import resources from './resources'
import { Grid } from './grid'
import { CarryableSystem } from './carryable'
import { Sequencer } from './sequencer'

// Base scene
const baseScene = new Entity()
baseScene.addComponent(resources.models.baseScene)
engine.addEntity(baseScene)

const stoneShape = new GLTFShape('models/SpiralStone_01/SpiralStone_01.glb')

let gridOffset = new Vector3(10, 0, 10)

let grid = new Grid(new Vector3(32, 1, 32), gridOffset)

// instance sequencer
let seqOffset = new Vector3(5, 0, 0)
let seqSze = new Vector3(4, 1, 16)
export let seq = new Sequencer(seqOffset, seqSze, grid)

let carryableSystem = new CarryableSystem(grid)
carryableSystem.setCarryMode(0)
engine.addSystem(carryableSystem)

// // Hack to turn off carry if you click the floor (sometimes block isn't quite in the middle of the screen.)
// floor.addComponent(new OnClick(() => {
// 	if (Carryable.currentCarry) {
// 	  Carryable.currentCarry.toggleCarry(new Transform()); // Turning off, so transform doesn't matter.
// 	}
//   }))
//   engine.addEntity(floor);

// Kalimba sounds
export const kalimbaSounds: AudioClip[] = [
  resources.sounds.kalimbaNotes.c3,
  resources.sounds.kalimbaNotes.a3,
  resources.sounds.kalimbaNotes.f3,
  resources.sounds.kalimbaNotes.a4,
  resources.sounds.kalimbaNotes.e4,
  resources.sounds.kalimbaNotes.f4,
  resources.sounds.kalimbaNotes.g4,
]

for (let i = 0; i < kalimbaSounds.length; i++) {
  const key = new MusicalStone(
    stoneShape,
    new Transform({
      position: new Vector3(2 + i * 2, 0.11, 8),
      scale: new Vector3(1, 1, 1),
      rotation: Quaternion.Euler(90, 0, 0),
    }),
    kalimbaSounds[i],
    i
  )

  stones.push(key)
}

const clone1 = new MusicalStone(
  stoneShape,
  new Transform({
    position: new Vector3(4, 0.11, 4),
    scale: new Vector3(0.5, 0.5, 0.5),
    rotation: Quaternion.Euler(90, 0, 0),
  }),
  kalimbaSounds[1],
  kalimbaSounds.length,
  true
)
stones.push(clone1)

const clone2 = new MusicalStone(
  stoneShape,
  new Transform({
    position: new Vector3(6, 0.11, 4),
    scale: new Vector3(0.5, 0.5, 0.5),
    rotation: Quaternion.Euler(90, 0, 0),
  }),
  kalimbaSounds[2],
  kalimbaSounds.length + 1,
  true
)
stones.push(clone2)

// Instance the input object
const input = Input.instance

//E button event
input.subscribe('BUTTON_DOWN', ActionButton.PRIMARY, false, (e) => {
  // drop stone
})
