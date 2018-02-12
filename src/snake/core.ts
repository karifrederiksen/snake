
const enum Dir {
    Left,
    Up,
    Right,
    Down,
}

// Config //
const SNAKE_INIT_LENGTH = 4
const SNAKE_INIT_DIR = Dir.Right
const SNAKE_INIT_X = 1
const SNAKE_INIT_Y = 1
////////////


export const enum GameState {
    InProgress,
    InProgressAndPaused,
    Lost,
    Won,
}

export interface Game {
    readonly width: number,
    readonly height: number,
    readonly boardState: ReadonlyArray<number[]>,
    readonly snake: Snake
    noms: [number, number]
    state: GameState,
    needsRender: boolean,
}

export interface Snake {
    length: number,
    direction: Dir,
    nextDirection: Dir,
    position: [number, number],
}

export function init(width: number, height: number): Game {
    const boardState = createArea(width, height)
    return {
        state: GameState.InProgress,
        width,
        height,
        boardState,
        snake: {
            direction: SNAKE_INIT_DIR,
            nextDirection: SNAKE_INIT_DIR,
            length: SNAKE_INIT_LENGTH,
            position: [SNAKE_INIT_X, SNAKE_INIT_Y],
        },
        noms: getRandomPosition(boardState, width, height),
        needsRender: true,
    }
}

export function reinit(game: Game): void {
    const { snake, boardState, width, height } = game
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            boardState[x][y] = 0
        }
    }
    game.noms = getRandomPosition(boardState, width, height)
    game.state = GameState.InProgress
    game.needsRender = true
    snake.direction = SNAKE_INIT_DIR
    snake.nextDirection = SNAKE_INIT_DIR
    snake.length = SNAKE_INIT_LENGTH
    snake.position = [SNAKE_INIT_X, SNAKE_INIT_Y]
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
    game.needsRender = true
    const nextPosition = getNextPosition(game, game.snake.nextDirection);
    if (isCollision(game, nextPosition)) {
        game.state = GameState.Lost;
        return;
    }
    const [x, y] = nextPosition;
    const { boardState, snake, noms, width, height } = game;
    snake.position[0] = x;
    snake.position[1] = y;

    if (x === noms[0] && y === noms[1]) {
        snake.length++
        game.noms = getRandomPosition(boardState, width, height)
    } else {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (boardState[x][y] > 0) {
                    boardState[x][y]--;
                }
            }
        }
    }
    snake.direction = snake.nextDirection
    boardState[x][y] = snake.length;
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

export function moveLeft({ snake }: Game): void {
    if (snake.direction !== Dir.Right) {
        snake.nextDirection = Dir.Left
    }
}

export function moveRight({ snake }: Game): void {
    if (snake.direction !== Dir.Left) {
        snake.nextDirection = Dir.Right
    }
}

export function moveUp({ snake }: Game): void {
    if (snake.direction !== Dir.Down) {
        snake.nextDirection = Dir.Up
    }
}

export function moveDown({ snake }: Game): void {
    if (snake.direction !== Dir.Up) {
        snake.nextDirection = Dir.Down
    }
}

export function getScore(snake: Snake): number {
    return snake.length - SNAKE_INIT_LENGTH
}