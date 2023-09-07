import {serveFile} from "https://deno.land/std/http/file_server.ts"
import {getCookies, setCookie} from "https://deno.land/std/http/cookie.ts"
import {Game} from "./game.ts"

// Tic-tac-toe is a fast-paced but short game. Keeping games in memory allows us to update
// clients as quickly as possible, while the loss in a crash would be relatively small.
const games = new Map<string, Game>()
const lobby = new Set<WebSocket>() // stores sockets for every client in the lobby
const gameSockets = new Map<string, Set<WebSocket>>()

if (import.meta.main) {
  Deno.serve(serverHandler)
}

// This function accepts all http requests, and routes them to the right function
// It also parses some common fields like the user id, and game id.
// For now our user id is set randomly and stored in a cookie. Will replace with real auth when we have the need.
async function serverHandler (req:Request) {
  const url = new URL(req.url)
  const path = url.pathname
  const params = Object.fromEntries(url.searchParams)
  const uid = (getCookies(req.headers) || {}).uid || self.crypto.randomUUID()

  if (path == '/create') return create(uid, params)
  if (path == '/lobby') return acceptSocket(req, lobby, broadcastLobby)

  const game = (params.id && games.get(params.id)) as Game
  if (path == '/join') return join(uid, game)
  if (path == '/move') return move(uid, game, params)
  if (path == '/abandon') return abandon(uid, game)
  if (path == '/game') return acceptSocket(req, gameSockets.get(game.id)!, () => broadcastGame(game))

  const resp = await serveFile(req, './index.html')
  setCookie(resp.headers, {name: 'uid', value: uid})
  return resp
}

export function create (uid:string, params:any) {
  let g = new Game()
  g.id = self.crypto.randomUUID()
  g.title = params.title || `Game ${games.size + 1}`
  g.players.push(uid)
  games.set(g.id, g)
  gameSockets.set(g.id, new Set())
  broadcastLobby()
  return new Response(g.id)
}

export function join (uid:string, game:Game) {
  if (game.players.includes(uid)) return new Response('ok') // you're already in
  if (game.players.length == game.maxPlayers) throw new Error('Game is full')
  game.players.push(uid)
  broadcastGame(game)
  broadcastLobby() // so anyone in the lobby can see it's no longer available
  return new Response('ok')
}

export function move (uid:string, game:Game, params:any) {
  let myPos = game.players.indexOf(uid)
  if (game.result) throw new Error('This game is over')
  if (game.turn != myPos) throw new Error('Its not your turn')
  if (isNaN(params.index)) throw new Error('Must pass an index to move')
  if (game.board[params.index] != null) throw new Error('Square already filled')

  game.board[params.index] = myPos
  game.turn = (game.turn + 1) % game.maxPlayers
  game.lastMoveAt = new Date()
  checkWinner(game)
  broadcastGame(game)
  return new Response('ok')
}

export function abandon (uid:string, game:Game) {
  if (!game.players.includes(uid)) throw new Error('Not a player in this game')
  if (game.result) throw new Error("Game is already over")

  game.result = game.players.filter(p => p != uid)[0]
  broadcastGame(game)
  return new Response('ok')
}

// check all the possible winning positions for one that is entirely claimed by one player
// we also check for draws if there is no winner, but every cell is taken
export function checkWinner (game:Game) {  
  let board = game.board
  let win = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diagonal
  ].find(p => typeof board[p[0]] == 'number' && p.every(i => board[p[0]] == board[i]))

  if (win) game.result = game.players[board[win[0]]]
  else if (board.every(v => v != null)) game.result = 'draw'
}

// notify all clients listening this game of an updated state
function broadcastGame (game:Game) {
  const data = JSON.stringify(game)
  gameSockets.get(game.id)?.forEach(s => s.send(data))
}

// notify all clients in the lobby of changes to games
// For now we send all games as the client could use that information for additional features,
// but we could easily filter this down to just games that still need players.
function broadcastLobby () {
  const data = JSON.stringify({games: Array.from(games.values())})
  lobby.forEach(s => s.send(data))
}

// Accepts a connection, upgrades it to a websocket, and calls a fn once open
function acceptSocket (req:Request, trackIn: Set<WebSocket>, onInit:Function) {
  const { socket, response } = Deno.upgradeWebSocket(req)
  socket.addEventListener('open', () => {
    trackIn.add(socket)
    onInit()
  })
  socket.addEventListener('close', () => trackIn.delete(socket))
  return response
}
