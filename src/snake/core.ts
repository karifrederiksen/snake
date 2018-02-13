
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

export interface Game {
    readonly initArgs: InitArgs
    readonly width: number,
    readonly height: number,
    readonly boardState: ReadonlyArray<number[]>,
    readonly snake: Snake
    noms: Readonly<[number, number]>,
    state: GameState,
}

export interface Snake {
    length: number,
    direction: Dir,
    nextDirection: Dir,
    position: Readonly<[number, number]>,
}

export interface InitArgs {
    readonly width: number
    readonly height: number
    readonly dir: Dir
    readonly position: Readonly<[number, number]>
    readonly snakeLength: number
}

export function init(args: InitArgs): Game {
    const boardState = createArea(args.width, args.height)
    return {
        initArgs: args,
        state: GameState.InProgress,
        width: args.width,
        height: args.height,
        boardState,
        snake: {
            direction: args.dir,
            nextDirection: args.dir,
            length: args.snakeLength,
            position: args.position,
        },
        noms: getRandomPosition(boardState, args.width, args.height),
    }
}

export function reinit(game: Game): void {
    const { snake, boardState, width, height, initArgs } = game
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            boardState[x][y] = 0
        }
    }
    game.noms = getRandomPosition(boardState, width, height)
    game.state = GameState.InProgress
    snake.direction = initArgs.dir
    snake.nextDirection = initArgs.dir
    snake.length = initArgs.snakeLength
    snake.position = initArgs.position
}

function getRandomPosition(board: ReadonlyArray<number[]>, width: number, height: number): [number, number] {
    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    if (board[x][y] > 0) {
        return getRandomPosition(board, width, height)
    }
    return [x, y]
}

function createArea(width: number, height: number): Array<Array<number>> {
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
    const { boardState, snake, noms, width, height } = game
    snake.position = [x, y]

    if (x === noms[0] && y === noms[1]) {
        snake.length++
        game.noms = getRandomPosition(boardState, width, height)
    } else {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (boardState[x][y] > 0) {
                    boardState[x][y]--
                }
            }
        }
    }
    snake.direction = snake.nextDirection
    boardState[x][y] = snake.length
}

function getNextPosition({ boardState, width, height, snake }: Game, direction: Dir): [number, number] {
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

function isCollision({ boardState, width, height }: Game, [x, y]: [number, number]): boolean {
    return x >= width
        || x < 0
        || y >= height
        || y < 0
        || boardState[x][y] > 1
}

export function setDirection({ snake }: Game, direction: Dir): void {
    // Disallow 180 degree turns
    switch (direction) {
        case Dir.Left:
            if (snake.direction !== Dir.Right) {
                snake.nextDirection = Dir.Left
            }
            break
        case Dir.Right:
            if (snake.direction !== Dir.Left) {
                snake.nextDirection = Dir.Right
            }
            break

        case Dir.Up:
            if (snake.direction !== Dir.Down) {
                snake.nextDirection = Dir.Up
            }
            break

        case Dir.Down:
            if (snake.direction !== Dir.Up) {
                snake.nextDirection = Dir.Down
            }
            break
    }
}

export function getScore({ snake, initArgs }: Game): number {
    return snake.length - initArgs.snakeLength
}