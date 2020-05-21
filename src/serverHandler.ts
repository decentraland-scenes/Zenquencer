export let seqNumbers: number[][] = []

export let awsServer = 'https://genesis-plaza.s3.us-east-2.amazonaws.com/'
export let fireBaseServer =
  'https://us-central1-genesis-plaza.cloudfunctions.net/app/'

// get lastest mural state
export async function getStones(): Promise<number[][]> {
  try {
    let url = awsServer + 'sequencer/stones.json'
    let response = await fetch(url).then()
    let json = await response.json()
    return json.stones
  } catch {
    log('error fetching from AWS server')
  }
}

// update mural
export async function changeSequencer() {
  try {
    let url = fireBaseServer + 'update-sequencer'
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
