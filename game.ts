// our schema for games
// we store the board as a linear array of cells, starting from the top left ({0,1,2} is the first row)
// each "cell" is either null (for blank), or the index of the player (ie first player is 0)
export class Game {
  id = ''
  title = ''
  board: number[] = new Array(9).fill(null)
  lastMoveAt?: Date
  players: string[] = []
  maxPlayers = 2
  turn = Math.floor(Math.random() * this.maxPlayers) // index of the player whose turn it is
  result?: string // null (in progress), winner id, or "draw"
}
