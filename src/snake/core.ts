import { Vec2 } from "./vec2"
import * as vec2 from "./vec2"

export const enum Dir {
    Left,
    Up,
    Right,
    Down,
}

export const enum GameState {
    InProgress,
    InProgressAndPaused,
    Lost,
    Won,
}

export type Grid = ReadonlyArray<number[]>

export interface Game {
    readonly initArgs: InitArgs
    readonly gridSize: Vec2
    readonly grid: Grid,
    readonly snake: Snake
    noms: Vec2,
    state: GameState,
}

export interface Snake {
    length: number,
    direction: Dir,
    directionQueue: [Dir] | [Dir, Dir]
    nextDirection: Dir,
    nextNextDirection: Dir | undefined,
    position: Vec2,
}

export interface InitArgs {
    readonly gridSize: Vec2
    readonly dir: Dir
    readonly position: Vec2
    readonly snakeLength: number
}

export function init(args: InitArgs): Game {
    const [width, height] = args.gridSize
    const grid = createGrid(width, height)
    return {
        initArgs: args,
        state: GameState.InProgress,
        gridSize: args.gridSize,
        grid,
        snake: {
            direction: args.dir,
            directionQueue: [args.dir],
            nextDirection: args.dir,
            nextNextDirection: undefined,
            length: args.snakeLength,
            position: args.position,
        },
        noms: getRandomPosition(grid, width, height),
    }
}

export function reinit(game: Game): void {
    const { snake, grid, gridSize, initArgs } = game
    const [width, height] = gridSize
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            grid[x][y] = 0
        }
    }
    game.noms = getRandomPosition(grid, width, height)
    game.state = GameState.InProgress
    snake.direction = initArgs.dir
    snake.nextDirection = initArgs.dir
    snake.nextNextDirection = undefined
    snake.length = initArgs.snakeLength
    snake.position = initArgs.position
}

function getRandomPosition(grid: Grid, width: number, height: number): Vec2 {
    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    if (grid[x][y] > 0) {
        return getRandomPosition(grid, width, height)
    }
    return [x, y]
}

function createGrid(width: number, height: number): Grid {
    const arr = new Array<Array<number>>(width)
    for (let x = 0; x < width; x++) {
        const subArr = new Array<number>(height)
        for (let y = 0; y < height; y++) {
            subArr[y] = 0
        }
        arr[x] = subArr
    }
    return arr
}

export function update(game: Game): void {
    const nextPosition = getNextPosition(game, game.snake.nextDirection)
    if (isCollision(game, nextPosition)) {
        game.state = GameState.Lost
        return
    }
    const [x, y] = nextPosition
    const { grid, snake, noms, gridSize } = game
    const [width, height] = gridSize
    snake.position = [x, y]

    if (x === noms[0] && y === noms[1]) {
        snake.length++
        grid[x][y] = snake.length
        game.noms = getRandomPosition(grid, width, height)
    } else {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (grid[x][y] > 0) {
                    grid[x][y]--
                }
            }
        }
        grid[x][y] = snake.length
    }
    snake.direction = snake.nextDirection
    snake.nextDirection = snake.nextNextDirection !== undefined
        ? snake.nextNextDirection
        : snake.nextDirection
    snake.nextNextDirection = undefined
}

function getNextPosition({ grid, snake }: Game, direction: Dir): Vec2 {
    const [x, y] = snake.position
    switch (direction) {
        case Dir.Left:
            return [x - 1, y]
        case Dir.Up:
            return [x, y - 1]
        case Dir.Right:
            return [x + 1, y]
        case Dir.Down:
            return [x, y + 1]
    }
}

function isCollision({ grid, gridSize: [width, height] }: Game, [x, y]: Vec2): boolean {
    return x >= width
        || x < 0
        || y >= height
        || y < 0
        || grid[x][y] > 1
}

export function setDirection({ snake }: Game, direction: Dir): void {
    // Disallow 180 degree turns
    if (snake.direction === snake.nextDirection) {
        if (isDirectionAllowed(snake.direction, direction)) {
            snake.nextDirection = direction
        }
    } else {
        if (isDirectionAllowed(snake.nextDirection, direction)) {
            snake.nextNextDirection = direction
        }
    }
}

function isDirectionAllowed(current: Dir, next: Dir): boolean {
    switch (current) {
        case Dir.Left:
            return next !== Dir.Right
        case Dir.Right:
            return next !== Dir.Left
        case Dir.Up:
            return next !== Dir.Down
        case Dir.Down:
            return next !== Dir.Up
    }
}

export function getScore({ snake, initArgs }: Game): number {
    return snake.length - initArgs.snakeLength
}