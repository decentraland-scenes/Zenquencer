//import utils from '../node_modules/decentraland-ecs-utils/index'

import resources from './resources'
import { BasePlate, plates } from './basePlate'
import { getStones, seqNumbers } from './serverHandler'

// Base scene
const baseScene = new Entity()
baseScene.addComponent(resources.models.baseScene)
baseScene.addComponent(
  new Transform({
    position: new Vector3(16, 0, 0),
    rotation: Quaternion.Euler(0, -90, 0)
  }
))
engine.addEntity(baseScene)

let seqOffset = new Vector3(5, 0.2, 4)
let seqLength = 16

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

updateStones()

async function updateStones() {
  let currentStones = await getStones()

  log(currentStones)
  for (let beat = 0; beat < currentStones.length; beat++) {
    for (let note = 0; note < currentStones[beat].length; note++) {
      seqNumbers[beat][note] = currentStones[beat][note]
      let currentPlate = plates[beat * 7 + note]
      if (currentStones[beat][note] == 0) {
        currentPlate.stoneOn = false
        currentPlate.stone.removeComponent(GLTFShape)
      } else {
        currentPlate.stoneOn = true
        currentPlate.stone.addComponentOrReplace(currentPlate.stone.shape)
      }
    }
  }
}

// play loop if other was playing loop (artichoke?)
