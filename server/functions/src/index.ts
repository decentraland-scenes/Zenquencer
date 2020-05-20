//const admin = require('firebase-admin')
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors({ origin: true }))
require('isomorphic-fetch')

export type messageBoard = {
  name: string
  messages: string[]
}

app.get('/hello-world', (req: any, res: any) => {
  return res.status(200).send('Hello World!')
})

app.post('/update-sequencer', async (req: any, res: any) => {
  let stones = req.body.stones

  updateSeqJSON(stones)

  return res.status(200).send('Updated Sequencer')
})

app.get('/sequencer', async (req: any, res: any) => {
  let url =
    'https://genesis-plaza.s3.us-east-2.amazonaws.com/sequencer/stones.json'

  let currentSeq: number[][] = await getSeqJSON(url)

  return res.status(200).json({ stones: currentSeq })
})

//// AWS
const AWS = require('aws-sdk')

const AWSconfig = require('../keys/aws-key.json')

// You will need your own amazon key to handle this authentication step
AWS.config.setPromisesDependency()
AWS.config.update({
  accessKeyId: AWSconfig.AWSAccessKeyId,
  secretAccessKey: AWSconfig.AWSSecretKey,
  region: 'us-east-2',
})

export async function updateSeqJSON(stones: number[][]) {
  var upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: 'genesis-plaza',
      Key: 'sequencer/stones.json',
      Body: JSON.stringify({ stones: stones }),
      ACL: 'public-read',
      ContentType: 'application/json; charset=utf-8',
    },
  })

  var promise = upload.promise()

  promise.then(
    function (data: any) {
      console.log('Successfully uploaded mural JSON')
    },
    function (err: any) {
      console.log('There was an error uploading mural json file: ', err.message)
    }
  )
}

export async function getSeqJSON(url: string): Promise<any> {
  try {
    let response = await fetch(url).then()
    let json = await response.json()
    return json.stones
  } catch {
    console.log('error fetching from AWS server')
    console.log('url used: ', url)
    return []
  }
}
