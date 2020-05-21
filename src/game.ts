//import utils from '../node_modules/decentraland-ecs-utils/index'

import resources from './resources'
import { BasePlate, plates } from './basePlate'
import { getStones, seqNumbers } from './serverHandler'

// Base scene
const baseScene = new Entity()
baseScene.addComponent(resources.models.baseScene)
baseScene.addComponent(new Transform({ scale: new Vector3(1, 1, 2) }))
engine.addEntity(baseScene)

let seqOffset = new Vector3(5, 0.2, 4)
let seqLength = 16

// // Hack to turn off carry if you click the floor (sometimes block isn't quite in the middle of the screen.)
// floor.addComponent(new OnClick(() => {
// 	if (Carryable.currentCarry) {
// 	  Carryable.currentCarry.toggleCarry(new Transform()); // Turning off, so transform doesn't matter.
// 	}
//   }))
//   engine.addEntity(floor);

// Kalimba sounds
export const kalimbaSounds: AudioClip[] = [
  resources.sounds.kalimbaNotes.f3,
  resources.sounds.kalimbaNotes.a3,
  resources.sounds.kalimbaNotes.c3,

  resources.sounds.kalimbaNotes.e4,
  resources.sounds.kalimbaNotes.f4,
  resources.sounds.kalimbaNotes.g4,
  resources.sounds.kalimbaNotes.a4,
]

for (let beat = 0; beat < seqLength; beat++) {
  seqNumbers.push([])
  for (let note = 0; note < kalimbaSounds.length; note++) {
    const plate = new BasePlate(
      resources.models.plate,
      new Transform({
        position: new Vector3(
          seqOffset.x + note,
          seqOffset.y,
          seqOffset.z + beat
        ),
        scale: new Vector3(1, 1, 1),
        rotation: Quaternion.Euler(0, 0, 0),
      }),
      kalimbaSounds[note],
      beat * 7 + note
    )

    plates.push(plate)
    seqNumbers[beat].push(0)
  }
}

// updateStones()

async function updateStones() {
  let currentStones = await getStones()

  log(currentStones)
  for (let i = 0; i < currentStones.length; i++) {
    for (let j = 0; j < currentStones[i].length; j++) {
      seqNumbers[i][j] = currentStones[i][j]
      if (currentStones[i][j] == 0) {
        plates[i * 7 + j].stoneOn = false
        plates[i * 7 + j].stone.getComponent(GLTFShape).visible = false
      } else {
        plates[i * 7 + j].stoneOn = true
        plates[i * 7 + j].stone.getComponent(GLTFShape).visible = true
      }
    }
  }
}
