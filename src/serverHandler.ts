import { seqNumbers } from './stones'
import utils from '../node_modules/decentraland-ecs-utils/index'
import { getCurrentRealm } from '@decentraland/EnvironmentAPI'

// we're hardcoding the player's realm, bc it can't be fetched while the scene is being loaded. Needs to be triggered after that.
export let playerRealm = 'localhost-stub' //getRealm()

// fetch the player's realm
export async function setRealm() {
  let realm = await getCurrentRealm()
  log(`You are in the realm: ${JSON.stringify(realm.displayName)}`)
  playerRealm = realm.displayName
}

// fetch the player's realm
export async function getRealm() {
  let realm = await getCurrentRealm()
  log(`You are in the realm: ${JSON.stringify(realm.displayName)}`)
  return realm.displayName
}

// external servers being used by the project - Please change these to your own if working on something else!
export let awsServer = 'https://genesis-plaza.s3.us-east-2.amazonaws.com/'
export let fireBaseServer =
  'https://us-central1-genesis-plaza.cloudfunctions.net/app/'

// get latest sequencer state stored in server
export async function getStones(): Promise<number[][]> {
  try {
    // if (!playerRealm) {
    //   playerRealm = await getRealm()
    // }
    let url = awsServer + 'sequencer/' + playerRealm + '/stones.json'
    log('url used ', url)
    let response = await fetch(url)
    let json = await response.json()
    return json.stones
  } catch {
    log('error fetching from AWS server')
  }
}

// change data in sequencer
export async function changeSequencer() {
  // if (!playerRealm) {
  //   await setRealm()
  // }
  seqChanger.addComponentOrReplace(
    // Only send request if no more changes come over the next second
    new utils.Delay(1000, async function () {
      try {
        let url = fireBaseServer + 'update-sequencer?realm=' + playerRealm
        let body = JSON.stringify({ stones: seqNumbers })
        let response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
        })
        return response.json()
      } catch {
        log('error fetching from AWS server')
      }
    })
  )
}

// dummy entity to throttle the sending of change requests
let seqChanger = new Entity()
engine.addEntity(seqChanger)
