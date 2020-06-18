import resources from './resources'
import { Stone, stones, seqNumbers } from './stones'
import { getStones } from './serverHandler'

export const sceneMessageBus = new MessageBus()

// Base scene
const base = new Entity()
base.addComponent(resources.models.base)
base.addComponent(
  new Transform({
    position: new Vector3(0, 0, 32),
    rotation: Quaternion.Euler(0, 90, 0),
  })
)
engine.addEntity(base)

const pool = new Entity()
pool.addComponent(resources.models.pool)
pool.addComponent(
  new Transform({
    position: new Vector3(8, 0, 11.5),
    rotation: Quaternion.Euler(0, 90, 0),
  })
)
engine.addEntity(pool)

let seqOffset = new Vector3(5, 0.3, 4)
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
    const currentStone = new Stone(
      resources.models.stone,
      new Transform({
        position: new Vector3(
          seqOffset.x + note,
          seqOffset.y,
          seqOffset.z + beat
        ),
        scale: new Vector3(1, 1, 1),
        rotation: Quaternion.Euler(180, 0, 0),
      }),
      kalimbaSounds[note],
      beat * 7 + note
    )

    stones.push(currentStone)
    seqNumbers[beat].push(0)
  }
}

//setRealm().then()
updateStones()

async function updateStones() {
  let currentStones = await getStones()
  if (!currentStones) return

  log(currentStones)
  for (let beat = 0; beat < currentStones.length; beat++) {
    for (let note = 0; note < currentStones[beat].length; note++) {
      seqNumbers[beat][note] = currentStones[beat][note]
      let currentStone = stones[beat * 7 + note]
      if (currentStones[beat][note] == 0) {
        currentStone.stoneOn = false

        currentStone.drop.removeComponent(GLTFShape)
      } else {
        currentStone.stoneOn = true
        currentStone.getComponent(Transform).rotation = Quaternion.Euler(
          0,
          0,
          0
        )
        currentStone.drop.addComponentOrReplace(currentStone.drop.shape)
      }
    }
  }
}
