import { start } from "./snake/game"

const LOCAL_STORAGE_HIGHSCORE_KEY = "karifrederiksen.github.io|Snake high score"

function getHighScore(): number | null {
    try {
        const score = Number(
            localStorage.getItem(LOCAL_STORAGE_HIGHSCORE_KEY) ?? "NaN",
        )
        return Number.isNaN(score) ? null : score
    } catch (_) {
        return null
    }
}

function setHighScore(n: number): void {
    try {
        localStorage.setItem(LOCAL_STORAGE_HIGHSCORE_KEY, n.toString())
    } catch {}
}

const container = document.getElementById(
    "game-container",
) as HTMLCanvasElement | null

if (container) {
    start(container, { getHighScore, setHighScore })
}
