import { start } from "./snake/game"

const container = document.getElementById("game-container") as HTMLCanvasElement | null

if (container) {
    start(container)
}