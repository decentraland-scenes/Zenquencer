# Piano Floor Example Scene

_demo of a sequencer running in preview._

<!-- ![demo](https://github.com/decentraland-scenes/piano-floor-example-scene/blob/master/screenshots/piano-floor.gif) -->

## Description

A secuencer that can be used to make music with others.

When notes are played, activated or deactivated, these changes are shared with nearby players via the message bus. The note pattern is also stored in an Amazon S3 server.

When a player walks into the scene, they download the latest pattern stored in the server, so everyone hears the same.
