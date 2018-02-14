
export type Vec2 = Readonly<[number, number]>

export function of(n: number): Vec2
export function of(x: number, y: number): Vec2
export function of(x: number, y?: number): Vec2 {
    if (y !== undefined) {
        return [x, y]
    }
    return [x, x]
}

export function add([lx, ly]: Vec2, [rx, ry]: Vec2): Vec2 {
    return [lx + rx, ly + ry]
}

export function divide([lx, ly]: Vec2, [rx, ry]: Vec2): Vec2 {
    return [lx / rx, ly / ry]
}

export function withX(x: number, [_, y]: Vec2): Vec2 {
    return [x, y]
}

export function withY(y: number, [x, _]: Vec2): Vec2 {
    return [x, y]
}