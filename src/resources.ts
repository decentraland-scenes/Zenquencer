export default {
  models: {
    pool: new GLTFShape('models/pool.glb'),
    stone: new GLTFShape('models/stone.glb'),
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
