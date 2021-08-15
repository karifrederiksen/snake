import { Game, GameState, Dir } from "./core"
import * as Core from "./core"
import { GridRenderingContext, Color } from "./rendering"

// CONFIG //
const MS_PER_TICK = 100

const GRID_WIDTH = 20
const GRID_HEIGHT = 20

const SNAKE_INIT_LENGTH = 4
const SNAKE_INIT_DIR = Dir.Right
const SNAKE_INIT_X = 1
const SNAKE_INIT_Y = 1
////////////

export interface GameWrapper {
    game: Game
    needsRender: boolean
    statusContainer: HtmlTextRef
    scoreContainer: HtmlTextRef
}

export class HtmlTextRef {
    private _content: string
    private _color: string

    constructor(readonly elem: HTMLElement) {
        this._content = elem.textContent ?? ""
        this._color = elem.style.color
    }

    content(value: string): void {
        if (this._content !== value) {
            this._content = value
            this.elem.textContent = value
        }
    }

    color(value: string): void {
        if (this._color !== value) {
            this._color = value
            this.elem.style.color = value
        }
    }
}

function overlay(canvas: HTMLCanvasElement, elem: HTMLElement): void {
    canvas.before(elem)
    elem.style.position = "absolute"
    elem.style.width = canvas.width + "px"
    elem.style.height = canvas.height + "px"
}

export function start(canvas: HTMLCanvasElement): void {
    const wglCtx = canvas.getContext("webgl2", { desynchronized: true })!
    const game: GameWrapper = {
        game: Core.init({
            gridSize: [GRID_WIDTH, GRID_HEIGHT],
            dir: SNAKE_INIT_DIR,
            snakeLength: SNAKE_INIT_LENGTH,
            position: [SNAKE_INIT_X, SNAKE_INIT_Y],
        }),
        needsRender: true,
        statusContainer: new HtmlTextRef(document.createElement("div")),
        scoreContainer: new HtmlTextRef(document.createElement("div")),
    }
    canvas.before(game.scoreContainer.elem)
    canvas.before(game.statusContainer.elem)
    overlay(canvas, game.scoreContainer.elem)
    game.scoreContainer.elem.style.fontSize = "28px"
    game.scoreContainer.elem.style.color = "rgb(0, 235, 255)"
    game.scoreContainer.elem.style.padding = "16px 0px 0px 16px"
    overlay(canvas, game.statusContainer.elem)
    game.scoreContainer.elem.style.fontSize = "28px"
    game.statusContainer.elem.style.font = "72px Roboto"
    game.statusContainer.elem.style.textAlign = "center"
    game.statusContainer.elem.style.verticalAlign = "middle"

    const ctx = new GridRenderingContext(
        wglCtx,
        [canvas.width, canvas.height],
        game.game.gridSize,
    )

    window.addEventListener("keydown", (ev) => handleInput(game, ev))

    renderLoop(ctx, game)

    setInterval(() => update(game), MS_PER_TICK)
}

function renderLoop(ctx: GridRenderingContext, wrapper: GameWrapper): void {
    render(ctx, wrapper)
    requestAnimationFrame(() => renderLoop(ctx, wrapper))
}

export function render(ctx: GridRenderingContext, wrapper: GameWrapper): void {
    const time = performance.now()
    if (wrapper.needsRender) {
        if (wrapper.game.state === GameState.InProgress) {
            renderGrid(ctx, wrapper.game)
        }
        wrapper.needsRender = false
    }
    renderNoms(ctx, wrapper.game, time)
    ctx.flush()
    renderStatus(wrapper)
    renderScore(wrapper)
}

function renderStatus(game: GameWrapper) {
    switch (game.game.state) {
        case GameState.InProgress:
            game.statusContainer.content("")
            break
        case GameState.InProgressAndPaused:
            game.statusContainer.content("Paused")
            game.statusContainer.color("rgb(240, 20, 20)")
            break
        case GameState.Lost:
            game.statusContainer.content("You died")
            game.statusContainer.color("rgb(255, 0, 0)")
            break
        case GameState.Won:
            game.statusContainer.content("You won?")
            game.statusContainer.color("rgb(255, 0, 0)")
            break
    }
}

function lerp(pct: number, from: number, to: number): number {
    return from + pct * (to - from)
}

function lerpSnakeStyle(pct: number): Color {
    return {
        r: lerp(pct, 0.6, 0.8),
        g: lerp(pct, 0.6, 1),
        b: lerp(pct, 0.5, 0.4),
    }
}

function renderNoms(ctx: GridRenderingContext, game: Game, time: number): void {
    const [x, y] = game.noms
    ctx.setColor(x, y, nomStyle(time))
}

function nomStyle(time: number): Color {
    const b = (time % 100) / 100
    const g = (time % 200) / 200
    return { r: 1, g: g, b: b }
}

function renderGrid(ctx: GridRenderingContext, game: Game): void {
    ctx.bufferGrid((x, y) => {
        const val = game.grid[x][y]
        if (val > 0) {
            if (val == game.snake.length) {
                // Head
                return { r: 1, g: 1, b: 1 }
            }
            // Tail
            const pct = game.grid[x][y] / game.snake.length
            return lerpSnakeStyle(pct)
        }
        // Empty block
        return { r: 0, g: 0, b: 0 }
    })
}

function renderScore(game: GameWrapper): void {
    const score = Core.getScore(game.game)
    const maxScore = game.game.gridSize[0] * game.game.gridSize[1]
    const pct = score / maxScore
    game.scoreContainer.content(score.toString())
    const r = Math.round(lerp(pct, 0, 255))
    const b = Math.round(lerp(pct, 255, 0))
    game.scoreContainer.color(`rgb(${r}, 255, ${b})`)
}

export function update(wrapper: GameWrapper): void {
    const game = wrapper.game
    switch (game.state) {
        case GameState.InProgress:
            Core.update(game)
            wrapper.needsRender = true
            break
        default:
            break
    }
}

export function handleInput(wrapper: GameWrapper, event: KeyboardEvent): void {
    const code = event.code
    switch (wrapper.game.state) {
        case GameState.InProgress:
            handleGameInput(wrapper, code)
            break
        case GameState.InProgressAndPaused:
            handlePausedInput(wrapper, code)
            break
        case GameState.Lost:
        case GameState.Won:
            handleGameEndedInput(wrapper, code)
            break
    }
}

function handleGameEndedInput(wrapper: GameWrapper, key: string): void {
    switch (key) {
        case "Enter": // Enter
        case "Escape": // Esc
        case "Space": // Space
            wrapper.game = Core.init(wrapper.game.initArgs)
            wrapper.needsRender = true
            break
        default:
            break
    }
}

function handleGameInput(wrapper: GameWrapper, key: string): void {
    const game = wrapper.game
    switch (key) {
        case "Enter": // Enter
        case "Escape": // Esc
        case "Space": // Space
            game.state = GameState.InProgressAndPaused
            wrapper.needsRender = true
            break
        case "ArrowLeft":
        case "KeyA":
            Core.setDirection(game, Dir.Left)
            break
        case "ArrowUp":
        case "KeyW":
            Core.setDirection(game, Dir.Up)
            break
        case "ArrowRight":
        case "KeyD":
            Core.setDirection(game, Dir.Right)
            break
        case "ArrowDown":
        case "KeyS":
            Core.setDirection(game, Dir.Down)
            break
        default:
            break
    }
}

function handlePausedInput({ game }: GameWrapper, key: string): void {
    switch (key) {
        case "Enter": // Enter
        case "Escape": // Esc
        case "Space": // Space
            game.state = GameState.InProgress
            break
        default:
            break
    }
}
