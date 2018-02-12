import { Game, Snake, GameState, init, reinit, update, getScore, moveLeft, moveRight, moveUp, moveDown } from "./core"


// CONFIG //
const MS_PER_TICK = 100
const BOARD_WIDTH = 20
const BOARD_HEIGHT = 20
////////////


export function start(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext("2d")!
    const game = init(BOARD_WIDTH, BOARD_HEIGHT);
    
    window.addEventListener("keydown", ev => handleInput(game, ev.keyCode))

    renderLoop(ctx, game)
    updateLoop(ctx, game)
}



function renderLoop(ctx: CanvasRenderingContext2D, game: Game): void {
    if (game.needsRender) {
        switch (game.state) {
            case GameState.InProgress:
                render(ctx, game, performance.now())
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
        game.needsRender = false
    } else {
        renderNomsOnly(ctx, game, performance.now())
    }
    requestAnimationFrame(() => renderLoop(ctx, game))
}

function render(ctx: CanvasRenderingContext2D, game: Game, time: number): void {
    const [dotWidth, dotHeight] = getDotSize(ctx.canvas, game)

    ctx.fillStyle = "rgb(0, 0, 0)"
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    for (let x = 0; x < game.width; x++) {
        for (let y = 0; y < game.height; y++) {
            if (game.noms[0] === x && game.noms[1] === y) {
                // Noms
                ctx.fillStyle = nomStyle(time)
            } else if (game.boardState[x][y] == game.snake.length) {
                // Head
                ctx.fillStyle = "rgb(255, 255, 255)"
            } else if (game.boardState[x][y] > 0) {
                // Tail
                const pct = game.boardState[x][y] / game.snake.length
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
    return [canvas.width / game.width, canvas.height / game.height]
}

function lerp(pct: number, from: number, to: number): number {
    return from + Math.floor(pct * (to - from))
}

function lerpSnakeStyle(pct: number): string {
    return "rgb(" + lerp(pct, 150, 200) + "," + lerp(pct, 150, 255) + "," + lerp(pct, 140, 100) + ")"
}

function renderNomsOnly(ctx: CanvasRenderingContext2D, game: Game, time: number): void {
    const [x, y] = game.noms
    const [dotWidth, dotHeight] = getDotSize(ctx.canvas, game)
    ctx.fillStyle = nomStyle(time)
    ctx.fillRect(x * dotWidth, y * dotHeight, dotWidth, dotHeight)
}

function pctToByte(pct: number): number {
    return Math.floor((pct) * 255.999999)
}

function nomStyle(time: number): string {
    const b = (time % 100) / 100
    const g = (time % 200) / 200
    return "rgb(255," + pctToByte(g) + "," + pctToByte(b) + ")"
}

function renderGamePaused(ctx: CanvasRenderingContext2D, game: Game): void {
    ctx.fillStyle = "rgb(240, 20, 20)"
    ctx.font = "40px Roboto"
    ctx.fillText("Paused", 200, 200)
}

function renderGameLost(ctx: CanvasRenderingContext2D, game: Game): void {
    console.log("Game over")
    console.log("Score: " + getScore(game.snake))

    ctx.fillStyle = "rgb(255, 0, 0)"
    ctx.font = "40px Roboto"
    ctx.fillText("You died", 200, 200)
    ctx.font = "34px Roboto"
    ctx.fillText("Score: " + getScore(game.snake), 220, 400)
}

function renderGameWon(ctx: CanvasRenderingContext2D, game: Game): void {
    console.log("Game over")
    console.log("Score: " + getScore(game.snake))

    ctx.fillStyle = "rgb(255, 0, 0)"
    ctx.font = "40px Roboto"
    ctx.fillText("Wtf.", 200, 200)
    ctx.font = "34px Roboto"
    ctx.fillText("You won?", 220, 400)
}

function updateLoop(ctx: CanvasRenderingContext2D, game: Game): void {
    setInterval(() => {
        switch (game.state) {
            case GameState.InProgress:
                update(game)
                break
            default:
                break
        }
    }, MS_PER_TICK)
}

function handleInput(game: Game, keyCode: number): void {
    switch (game.state) {
        case GameState.InProgress:
            handleGameInput(game, keyCode)
            break
        case GameState.InProgressAndPaused:
            handlePausedInput(game, keyCode)
            break
        case GameState.Lost:
        case GameState.Won:
            handleGameEndedInput(game, keyCode)
            break
    }
}


function handleGameEndedInput(game: Game, keyCode: number): void {
    switch (keyCode) {
        case 13:
        case 32:
            reinit(game)
            break
        default:
            break
    }
}

function handleGameInput(game: Game, keyCode: number): void {
    switch(keyCode) {
        case 27:
            game.state = GameState.InProgressAndPaused
            game.needsRender = true
            break
        case 65:
        case 37:
            moveLeft(game)
            break
        case 87:
        case 38:
            moveUp(game)
            break
        case 68:
        case 39:
            moveRight(game)
            break
        case 83:
        case 40:
            moveDown(game)
            break
        default:
            break
    }
}

function handlePausedInput(game: Game, keyCode: number): void {
    console.log("unpausing", keyCode)
    switch (keyCode) {
        case 18: break
        default:
            game.state = GameState.InProgress
            break
    }
}

