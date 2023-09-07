import {abandon, join, move} from './server.ts'
import {Game} from './game.ts'
import {assertEquals} from "https://deno.land/std/assert/mod.ts"

Deno.test("Can play", () => {
  let g = mock([null, null, null, null, null, null, null, null, null])
  move('a', g, {index: 0})
  assertEquals(g.turn, 1)
  move('b', g, {index: 2})
  assertEquals(g.board.toString(), '0,,1,,,,,,')
  assertEquals(g.result, undefined)
})

Deno.test("Can win a game", () => {
  let g = mock([0, null, 1, 0, 1, null, null, null, null])
  move('a', g, {index: 6})
  assertEquals(g.result, 'a')
})

Deno.test("Can draw", () => {
  let g = mock([null, 1, 0, 1, 1, 0, 0, 0, 1])
  move('a', g, {index: 0})
  assertEquals(g.result, 'draw')
})

Deno.test("Can abandon", () => {
  let g = mock([])
  abandon('a', g)
  assertEquals(g.result, 'b')
})

Deno.test("Can join", () => {
  let g = new Game()
  join('a', g)
  assertEquals(g.players[0], 'a')
})

function mock (board:any[]) {
  return Object.assign(new Game(), {players: ['a', 'b'], turn: 0, board})
}
