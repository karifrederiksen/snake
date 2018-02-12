import { moveLeft, moveRight, moveUp, moveDown, update } from "./core"


export type AI = {
    readonly s: number
}

export type GameResult = { readonly score: number }

export function play(ai: AI): GameResult {
    // simulate
    throw "todo"
    //return { score: 0 }
}

