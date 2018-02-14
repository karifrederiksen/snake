import { Game, GameState, Dir } from "./core"
import { Vec2 } from "./vec2"
import * as Core from "./core"
import * as vec2 from "./vec2"


// CONFIG //
const MS_PER_TICK = 100

const GRID_WIDTH = 20
const GRID_HEIGHT = 20

const SNAKE_INIT_LENGTH = 4
const SNAKE_INIT_DIR = Dir.Right
const SNAKE_INIT_X = 1
const SNAKE_INIT_Y = 1
////////////


export function start(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext("2d")!
    const game = init()
    
    window.addEventListener("keydown", ev => handleInput(game, ev.keyCode))

    renderLoop(ctx, game)
    updateLoop(ctx, game)
}

interface GameWrapper {
    readonly game: Game
    needsRender: boolean
}

function init(): GameWrapper {
    return {
        game: Core.init({
            gridSize: [GRID_WIDTH, GRID_HEIGHT],
            dir: SNAKE_INIT_DIR,
            snakeLength: SNAKE_INIT_LENGTH,
            position: [SNAKE_INIT_X, SNAKE_INIT_Y],
        }),
        needsRender: true,
    }
}
 
function reinit(gameWrapper: GameWrapper): void {
    Core.reinit(gameWrapper.game)
    gameWrapper.needsRender = true
}

function renderLoop(ctx: CanvasRenderingContext2D, wrapper: GameWrapper): void {
    const game = wrapper.game
    const time = performance.now()
    if (wrapper.needsRender) {
        if (game.state === GameState.InProgress) {
            render(ctx, game, time)
        }
        wrapper.needsRender = false
    } 
    renderNoms(ctx, game, time)
    switch (game.state) {
        case GameState.InProgress:
            break
        case GameState.InProgressAndPaused:
            renderGamePaused(ctx, game)
            break
        case GameState.Lost:
            renderGameLost(ctx, game)
            break
        case GameState.Won:
            renderGameWon(ctx, game)
            break
    }
    requestAnimationFrame(() => renderLoop(ctx, wrapper))
}

function render(ctx: CanvasRenderingContext2D, game: Game, time: number): void {
    const [dotWidth, dotHeight] = getDotSize(ctx.canvas, game)

    ctx.fillStyle = "rgb(0, 0, 0)"
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const [width, height] = game.gridSize
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (game.grid[x][y] == game.snake.length) {
                // Head
                ctx.fillStyle = "rgb(255, 255, 255)"
            } else if (game.grid[x][y] > 0) {
                // Tail
                const pct = game.grid[x][y] / game.snake.length
                ctx.fillStyle = lerpSnakeStyle(pct)
            } else {
                // Empty block
                continue
            }
            ctx.fillRect(x * dotWidth, y * dotHeight, dotWidth, dotHeight)
        }
    }
}

function getDotSize(canvas: HTMLCanvasElement, game: Game): [number, number] {
    return vec2.divide([canvas.width, canvas.height], game.gridSize)
}

function lerp(pct: number, from: number, to: number): number {
    return from + Math.floor(pct * (to - from))
}

function lerpSnakeStyle(pct: number): string {
    return "rgb(" + lerp(pct, 150, 200) + "," + lerp(pct, 150, 255) + "," + lerp(pct, 140, 100) + ")"
}

function renderNoms(ctx: CanvasRenderingContext2D, game: Game, time: number): void {
    const [x, y] = game.noms
    const [dotWidth, dotHeight] = getDotSize(ctx.canvas, game)
    ctx.fillStyle = nomStyle(time)
    ctx.fillRect(x * dotWidth, y * dotHeight, dotWidth, dotHeight)
}

function pctToByte(pct: number): number {
    return Math.floor(pct * 255.999999)
}

function nomStyle(time: number): string {
    const b = (time % 100) / 100
    const g = (time % 200) / 200
    return "rgb(255," + pctToByte(g) + "," + pctToByte(b) + ")"
}

function renderGamePaused(ctx: CanvasRenderingContext2D, game: Game): void {
    ctx.fillStyle = "rgb(240, 20, 20)"
    ctx.font = "40px Roboto"
    ctx.fillText("Paused", 300, 200)
}

function renderGameLost(ctx: CanvasRenderingContext2D, game: Game): void {
    ctx.fillStyle = "rgb(255, 0, 0)"
    ctx.font = "40px Roboto"
    ctx.fillText("You died", 300, 200)
    ctx.font = "34px Roboto"
    ctx.fillText("Score: " + Core.getScore(game), 320, 400)
}

function renderGameWon(ctx: CanvasRenderingContext2D, game: Game): void {
    ctx.fillStyle = "rgb(255, 0, 0)"
    ctx.font = "40px Roboto"
    ctx.fillText("Wtf.", 300, 200)
    ctx.font = "34px Roboto"
    ctx.fillText("You won?", 320, 400)
}

function updateLoop(ctx: CanvasRenderingContext2D, wrapper: GameWrapper): void {
    setInterval(() => {
        const game = wrapper.game
        switch (game.state) {
            case GameState.InProgress:
                Core.update(game)
                wrapper.needsRender = true
                break
            default:
                break
        }
    }, MS_PER_TICK)
}

function handleInput(wrapper: GameWrapper, keyCode: number): void {

    switch (wrapper.game.state) {
        case GameState.InProgress:
            handleGameInput(wrapper, keyCode)
            break
        case GameState.InProgressAndPaused:
            handlePausedInput(wrapper, keyCode)
            break
        case GameState.Lost:
        case GameState.Won:
            handleGameEndedInput(wrapper, keyCode)
            break
    }
}

function handleGameEndedInput(wrapper: GameWrapper, keyCode: number): void {
    switch (keyCode) {
        case 13: // Enter
        case 27:// Esc
        case 32:// Space
            reinit(wrapper)
            break
        default:
            break
    }
}

function handleGameInput(wrapper: GameWrapper, keyCode: number): void {
    const game = wrapper.game
    switch(keyCode) {
        case 13: // Enter
        case 27:// Esc
        case 32:// Space
            game.state = GameState.InProgressAndPaused
            wrapper.needsRender = true
            break
        case 65:
        case 37:
            Core.setDirection(game, Dir.Left)
            break
        case 87:
        case 38:
            Core.setDirection(game, Dir.Up)
            break
        case 68:
        case 39:
            Core.setDirection(game, Dir.Right)
            break
        case 83:
        case 40:
            Core.setDirection(game, Dir.Down)
            break
        default:
            break
    }
}

function handlePausedInput({ game }: GameWrapper, keyCode: number): void {
    console.log("unpausing", keyCode)
    switch (keyCode) {
        case 13: // Enter
        case 27:// Esc
        case 32:// Space
            game.state = GameState.InProgress
            break
        default:
            break
    }
}

