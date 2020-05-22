import { seqNumbers } from './stones'
import { getRealm } from './realmData'

export let playerRealm = 'localhost-stub' //getRealm()

// external servers being used by the project - Please change these to your own if working on something else!
export let awsServer = 'https://genesis-plaza.s3.us-east-2.amazonaws.com/'
export let fireBaseServer =
  'https://us-central1-genesis-plaza.cloudfunctions.net/app/'

// get latest sequencer state stored in server
export async function getStones(): Promise<number[][]> {
  try {
    // if (!playerRealm) {
    //   await setRealm()
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
  try {
    // if (!playerRealm) {
    //   await setRealm()
    // }
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
}
