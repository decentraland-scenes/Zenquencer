import utils from '../node_modules/decentraland-ecs-utils/index'

export default {
  models: {
    baseScene: new GLTFShape('models/baseScene.glb'),
  },
  sounds: {
    kalimbaNotes: {
      f3: new AudioClip('sounds/kalimba/f3.wav'),
      a3: new AudioClip('sounds/kalimba/a3.wav'),
      c3: new AudioClip('sounds/kalimba/c3.wav'),
      a4: new AudioClip('sounds/kalimba/a4.wav'),
      e4: new AudioClip('sounds/kalimba/e4.wav'),
      f4: new AudioClip('sounds/kalimba/f4.wav'),
      g4: new AudioClip('sounds/kalimba/g4.wav'),
    },
    trigger: {
      triggerShape: new utils.TriggerSphereShape(8, Vector3.Zero()), // Trigger sphere with a radius of 8m
      triggerWhitePianoKey: new utils.TriggerBoxShape(
        new Vector3(0.35, 3, 2),
        new Vector3(0, 0, -1)
      ),
      triggerBlackPianoKey: new utils.TriggerBoxShape(
        new Vector3(0.35, 3, 2),
        Vector3.Zero()
      ),
    },
  },
}
