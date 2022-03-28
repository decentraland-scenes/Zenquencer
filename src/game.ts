const resources = {
  models: {
    base: new GLTFShape('models/baseSceneTwoByOne.glb'),
    pool: new GLTFShape('models/pool.glb'),
    stone: new GLTFShape('models/stone.glb'),
    linearButton: new GLTFShape('models/linear.glb'),
    randomButton: new GLTFShape('models/random.glb'),
    speedButton: new GLTFShape('models/speedButton.glb'),

    tube: new GLTFShape('models/tube.glb'),
  },
  sounds: {
    kalimbaNotes: {
      f3: new AudioClip('sounds/kalimba/f3.mp3'),
      a3: new AudioClip('sounds/kalimba/a3.mp3'),
      c3: new AudioClip('sounds/kalimba/c3.mp3'),
      a4: new AudioClip('sounds/kalimba/a4.mp3'),
      e4: new AudioClip('sounds/kalimba/e4.mp3'),
      f4: new AudioClip('sounds/kalimba/f4.mp3'),
      g4: new AudioClip('sounds/kalimba/g4.mp3'),
    },
  },
}

const sceneMessageBus = new MessageBus()

// reusable stone class
class MusicalDrop extends Entity {
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
  }
  public play(): void {
    this.getComponent(AudioSource).playOnce()
    this.anim.stop()
    this.anim.play()

    // animate
  }
}

const drops: MusicalDrop[] = []

// lightweight storage of sequencer state
const seqNumbers: number[][] = []

// reusable stone class
class Stone extends Entity {
  sound: AudioClip
  index: number
  stoneOn: boolean = false
  drop: MusicalDrop
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

    const thisStone = this

    this.addComponent(
      new OnPointerDown(
        (e) => {
          log('toggle stone')
          if (this.stoneOn) {
            sceneMessageBus.emit('hideStone', { stone: thisStone.index })
          } else {
            sceneMessageBus.emit('showStone', { stone: thisStone.index })
          }
        },
        {
          button: ActionButton.POINTER,
          hoverText: 'Toggle',
        }
      )
    )

    this.drop = new MusicalDrop(
      new GLTFShape('models/music-drop.glb'),
      new Transform({
        position: new Vector3(0, 0, 0),
      }),
      this.sound,
      this.index
    )
    this.drop.setParent(this)
    this.drop.removeComponent(GLTFShape)
    drops.push(this.drop)
  }
}

const stones: Stone[] = []

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

const seqOffset = new Vector3(5, 0.3, 4)
const seqLength = 16

// Kalimba sounds
const kalimbaSounds: AudioClip[] = [
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
updateStones().catch((error) => log(error))

async function updateStones() {
  const currentStones = await getStones().catch((error) => log(error))
  if (!currentStones) return

  log(currentStones)
  for (let beat = 0; beat < currentStones.length; beat++) {
    for (let note = 0; note < currentStones[beat].length; note++) {
      seqNumbers[beat][note] = currentStones[beat][note]
      const currentStone = stones[beat * 7 + note]
      if (currentStones[beat][note] === 0) {
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

const loopDuration = 60

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
class PlaySequence implements ISystem {
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
      if (this.playingMode === 1) {
        // sequence mode
        for (let i = 0; i < 7; i++) {
          if (seqNumbers[this.currentBeat][i]) {
            stones[this.currentBeat * 7 + i].drop.play()
          }
        }
      } else {
        // random mode
        const randomBeat = Math.floor(Math.random() * this.beats)
        for (let i = 0; i < 7; i++) {
          if (seqNumbers[randomBeat][i]) {
            stones[randomBeat * 7 + i].drop.play()
          }
        }
      }
    }
  }
}

///// Buttons
const tube = new Entity()
tube.addComponent(
  new Transform({
    position: new Vector3(8, 0, 11.5),
    rotation: Quaternion.Euler(0, 270, 0),
  })
)
const energyAnimation = new AnimationState('Energy_Action', { looping: false })
tube.addComponent(new Animator()).addClip(energyAnimation)
tube.addComponent(resources.models.tube)
engine.addEntity(tube)

const linear = new Entity()
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

const random = new Entity()
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

const slow2 = new Entity()
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

const slow1 = new Entity()
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

const neutral = new Entity()
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

const fast1 = new Entity()
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

const fast2 = new Entity()
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
    const newSpeed = e.speed * 4

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

// start loop, w 8 second loops and with 16 beats
const loopPlayer = new PlaySequence(8, loopDuration, 16)
engine.addSystem(loopPlayer)

// we're hardcoding the player's realm, bc it can't be fetched while the scene is being loaded. Needs to be triggered after that.
let playerRealm = 'localhost-stub' //getRealm()

// fetch the player's realm
async function setRealm() {
  //   let realm = await getCurrentRealm()
  //   log(`You are in the realm: ${JSON.stringify(realm.displayName)}`)
  playerRealm = `test`
}

// fetch the player's realm
async function getRealm() {
  return `test`
}

// external servers being used by the project - Please change these to your own if working on something else!
const awsServer = 'https://genesis-plaza.s3.us-east-2.amazonaws.com/'
const fireBaseServer =
  'https://us-central1-genesis-plaza.cloudfunctions.net/app/'

// get latest sequencer state stored in server
async function getStones(): Promise<number[][]> {
  try {
    // if (!playerRealm) {
    //   playerRealm = await getRealm()
    // }
    const url = awsServer + 'sequencer/' + playerRealm + '/stones.json'
    log('url used ', url)
    const response = await fetch(url)
    const json = await response.json()
    return json.stones
  } catch {
    log('error fetching from AWS server')
  }
}

// change data in sequencer
async function changeSequencer() {
  // if (!playerRealm) {
  //   await setRealm()
  // }
  //   seqChanger.addComponentOrReplace(
  //     // Only send request if no more changes come over the next second
  //     new utils.Delay(1000, async function () {
  //       try {
  //         let url = fireBaseServer + 'update-sequencer?realm=' + playerRealm
  //         let body = JSON.stringify({ stones: seqNumbers })
  //         let response = await fetch(url, {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: body,
  //         })
  //         return response.json()
  //       } catch {
  //         log('error fetching from AWS server')
  //       }
  //     })
  //   )
}

// dummy entity to throttle the sending of change requests
const seqChanger = new Entity()
engine.addEntity(seqChanger)

sceneMessageBus.on('showStone', (e) => {
  stones[e.stone].stoneOn = true
  stones[e.stone].getComponent(Transform).rotation = Quaternion.Euler(0, 0, 0)

  stones[e.stone].drop.addComponentOrReplace(stones[e.stone].drop.shape)

  if (!loopPlayer.playingMode) {
    stones[e.stone].drop.play()
  }

  const note = e.stone % 7
  const beat = Math.floor(e.stone / 7)
  log('beat ', beat, ' note ', note)
  seqNumbers[beat][note] = 1
  changeSequencer().catch((error) => log(error))
})

sceneMessageBus.on('hideStone', (e) => {
  stones[e.stone].stoneOn = false
  stones[e.stone].getComponent(Transform).rotation = Quaternion.Euler(180, 0, 0)

  stones[e.stone].drop.removeComponent(GLTFShape)

  const note = e.stone % 7
  const beat = Math.floor(e.stone / 7)
  seqNumbers[beat][note] = 0
  changeSequencer().catch((error) => log(error))
})
