# Zenquencer

A sequencer that can be used to make music with others, writing musical patterns by activating stones.

When notes are played, activated or deactivated, these changes are shared with nearby players via the message bus. The note pattern is also stored in an Amazon S3 server.

![](screenshot/zenquencer.gif)

<!-- ![demo](https://github.com/decentraland-scenes/piano-floor-example-scene/blob/master/screenshots/piano-floor.gif) -->

## Description

When a player walks into the scene, they download the latest pattern stored in the server, so everyone hears the same.

In this example you can play with a sequencer to write out some musical patterns and then play them back. When a player comes into the scene they download the latest pattern from off the server. Then, as different players that are there change the pattern, they get these changes from each other using the Message Bus, they don’t need to check the server regularly to know what’s new.

For this to work properly, we need to keep a separate version of this pattern for each realm and know what realm each player is on when they update the pattern. This is because only players that are in the same realm message each other via the Message Bus. There would otherwise be odd inconsistencies in what the pattern ends up being when players that are in different realms modify the same pattern without notifying each other. The scene includes the player’s realm as part of the requests it sends, and the server then handles a different .json file depending on the realm.

Another noteworthy thing we’re doing in this example is that changes aren’t sent to the server right away, but instead we do a little buffer using the utils.Delay component, so that if the player changes several notes in quick succession, the server only gets notified of the final state of the pattern. This helps reduce the number of requests that the server needs to handle. For it to work, each update request needs to send the full state of the pattern, rather than just the changed elements.




If something doesn’t work, please [file an issue](https://github.com/decentraland-scenes/Awesome-Repository/issues/new).
