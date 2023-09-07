A simple implementation of tic-tac-toe.

You can run it via `deno run --watch --allow-net --allow-read server.ts`

The server keeps game state in memory, and updates clients via websocket. A bare-bones web frontend is provided for testing.

## Conversation topics
* Why websockets
* separating games from the lobby
* Memory vs DB
* how we handle upgrades
* Game representation, specifically state vs history
* user database + auth
* adding multiple players and larger boards
* spectating

