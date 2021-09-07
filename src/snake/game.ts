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

export interface GameConfig {
    getHighScore(): number | null
    setHighScore(n: number): void
}

export interface GameWrapper {
    config: GameConfig
    game: Game
    needsRender: boolean
    highScore: number | null
    readonly statusContainer: HtmlTextRef
    readonly scoreContainer: HtmlTextRef
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

interface CancellationToken {
    cancelled: boolean
}

export interface StartedGame {
    stop(): void
}

export function start(
    canvas: HTMLCanvasElement,
    config: GameConfig,
): StartedGame | null {
    const wglCtx = canvas.getContext("webgl2", { desynchronized: true })
    if (wglCtx == null) {
        return null
    }

    const game: GameWrapper = {
        config,
        game: Core.init({
            gridSize: [GRID_WIDTH, GRID_HEIGHT],
            dir: SNAKE_INIT_DIR,
            snakeLength: SNAKE_INIT_LENGTH,
            position: [SNAKE_INIT_X, SNAKE_INIT_Y],
        }),
        needsRender: true,
        highScore: config.getHighScore(),
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

    const handleKeydown = (ev: KeyboardEvent) => {
        if (handleInput(game, ev)) {
            ev.preventDefault()
            ev.stopPropagation()
        }
    }

    window.addEventListener("keydown", handleKeydown)

    const cancellationToken: CancellationToken = { cancelled: false }

    renderLoop(cancellationToken, ctx, game)

    const updateIntervalId = setInterval(() => update(game), MS_PER_TICK)

    return {
        stop() {
            // dettach listeners
            window.removeEventListener("keydown", handleKeydown)

            // stop update and rendering loops
            clearInterval(updateIntervalId)
            cancellationToken.cancelled = true

            // remove html
            game.scoreContainer.elem.remove()
            game.statusContainer.elem.remove()

            // clear canvas
            wglCtx.clearColor(0, 0, 0, 0)
            wglCtx.clear(wglCtx.COLOR_BUFFER_BIT)
        },
    }
}

function renderLoop(
    cancellationToken: CancellationToken,
    ctx: GridRenderingContext,
    wrapper: GameWrapper,
): void {
    if (cancellationToken.cancelled) {
        return
    }
    render(ctx, wrapper)
    requestAnimationFrame(() => renderLoop(cancellationToken, ctx, wrapper))
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

    if (game.highScore === null) {
        game.scoreContainer.content(Core.getScore(game.game).toString())
    } else {
        game.scoreContainer.content(
            `${Core.getScore(game.game)} | ${game.highScore}`,
        )
    }
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
        case GameState.Won:
        case GameState.Lost: {
            const score = Core.getScore(game)
            if (score > (wrapper.highScore ?? 0)) {
                wrapper.config.setHighScore(score)
            }
            break
        }
        default:
            break
    }
}

export function handleInput(
    wrapper: GameWrapper,
    event: KeyboardEvent,
): boolean {
    const code = event.code
    switch (wrapper.game.state) {
        case GameState.InProgress:
            return handleGameInput(wrapper, code)
        case GameState.InProgressAndPaused:
            return handlePausedInput(wrapper, code)
        case GameState.Lost:
        case GameState.Won:
            return handleGameEndedInput(wrapper, code)
    }
}

function handleGameEndedInput(wrapper: GameWrapper, key: string): boolean {
    switch (key) {
        case "Enter":
        case "Escape":
        case "Space":
            wrapper.game = Core.init(wrapper.game.initArgs)
            wrapper.needsRender = true
            wrapper.highScore = wrapper.config.getHighScore()
            return true
        default:
            return false
    }
}

function handleGameInput(wrapper: GameWrapper, key: string): boolean {
    const game = wrapper.game
    switch (key) {
        case "Enter":
        case "Escape":
        case "Space":
            game.state = GameState.InProgressAndPaused
            wrapper.needsRender = true
            return true
        case "ArrowLeft":
        case "KeyA":
            Core.setDirection(game, Dir.Left)
            return true
        case "ArrowUp":
        case "KeyW":
            Core.setDirection(game, Dir.Up)
            return true
        case "ArrowRight":
        case "KeyD":
            Core.setDirection(game, Dir.Right)
            return true
        case "ArrowDown":
        case "KeyS":
            Core.setDirection(game, Dir.Down)
            return true
        default:
            return false
    }
}

function handlePausedInput({ game }: GameWrapper, key: string): boolean {
    switch (key) {
        case "Enter":
        case "Escape":
        case "Space":
            game.state = GameState.InProgress
            return true
        default:
            return false
    }
}
