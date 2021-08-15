import { Vec2 } from "./vec2"
import { createProgram } from "./glsl"

export interface Color {
    readonly r: number
    readonly g: number
    readonly b: number
}

const ATTRIBUTE_COUNT = 5

const VERTEX_SRC: string = `
precision highp float;

attribute vec2 a_position;
attribute vec3 a_color;

uniform vec2 canvas_resolution;

varying vec3 v_color;

void main() {
    vec2 pos = (a_position / canvas_resolution) * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
    gl_Position = vec4(pos, 0.0, 1.0);
    v_color = a_color;
}
`

const FRAGMENT_SRC: string = `
precision highp float;

varying vec3 v_color;

void main() {
    gl_FragColor = vec4(v_color, 1.0);
}
`

export class GridRenderingContext {
    private readonly program: WebGLProgram
    private readonly buf: WebGLBuffer
    private readonly array: Float32Array
    private readonly sizeUniform: WebGLUniformLocation
    private readonly blockSize: Vec2

    constructor(
        private readonly gl: WebGL2RenderingContext,
        private readonly canvasSize: Vec2,
        private readonly gridSize: Vec2,
    ) {
        this.blockSize = [
            Math.ceil(canvasSize[0] / gridSize[0]),
            Math.ceil(canvasSize[1] / gridSize[1]),
        ]
        this.program = createProgram(gl, VERTEX_SRC, FRAGMENT_SRC)!
        const blockCount = gridSize[0] * gridSize[1]
        this.buf = gl.createBuffer()!
        this.array = new Float32Array(blockCount * 6 * ATTRIBUTE_COUNT)
        this.sizeUniform = gl.getUniformLocation(
            this.program,
            "canvas_resolution",
        )!

        gl.useProgram(this.program)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        gl.bindAttribLocation(this.program, 0, "a_position")
        gl.bindAttribLocation(this.program, 1, "a_color")
    }

    bufferGrid(f: (x: number, y: number) => Color): void {
        const { array, gridSize, blockSize } = this
        const [blockWidth, blockHeight] = blockSize
        let o = 0
        for (let y = 0; y < gridSize[1]; y++) {
            const y0 = y * blockHeight
            const y1 = y0 + blockHeight
            for (let x = 0; x < gridSize[0]; x++) {
                const x0 = x * blockWidth
                const x1 = x0 + blockWidth

                const { r, g, b } = f(x, y)
                // triangle 1
                array[o++] = x0
                array[o++] = y0
                array[o++] = r
                array[o++] = g
                array[o++] = b
                array[o++] = x0
                array[o++] = y1
                array[o++] = r
                array[o++] = g
                array[o++] = b
                array[o++] = x1
                array[o++] = y0
                array[o++] = r
                array[o++] = g
                array[o++] = b
                // triangle 2
                array[o++] = x1
                array[o++] = y1
                array[o++] = r
                array[o++] = g
                array[o++] = b
                array[o++] = x0
                array[o++] = y1
                array[o++] = r
                array[o++] = g
                array[o++] = b
                array[o++] = x1
                array[o++] = y0
                array[o++] = r
                array[o++] = g
                array[o++] = b
            }
        }
    }

    setColor(x: number, y: number, { r, g, b }: Color): void {
        const { array, gridSize, blockSize } = this
        const [blockWidth, blockHeight] = blockSize

        let o = (gridSize[0] * y + x) * 6 * ATTRIBUTE_COUNT
        const y0 = y * blockHeight
        const y1 = y0 + blockHeight
        const x0 = x * blockWidth
        const x1 = x0 + blockWidth

        // triangle 1
        array[o++] = x0
        array[o++] = y0
        array[o++] = r
        array[o++] = g
        array[o++] = b
        array[o++] = x0
        array[o++] = y1
        array[o++] = r
        array[o++] = g
        array[o++] = b
        array[o++] = x1
        array[o++] = y0
        array[o++] = r
        array[o++] = g
        array[o++] = b
        // triangle 2
        array[o++] = x1
        array[o++] = y1
        array[o++] = r
        array[o++] = g
        array[o++] = b
        array[o++] = x0
        array[o++] = y1
        array[o++] = r
        array[o++] = g
        array[o++] = b
        array[o++] = x1
        array[o++] = y0
        array[o++] = r
        array[o++] = g
        array[o++] = b
    }

    flush(): void {
        const { gl, canvasSize, gridSize } = this
        const blockCount = gridSize[0] * gridSize[1]

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
        gl.bufferData(gl.ARRAY_BUFFER, this.array, gl.DYNAMIC_DRAW)

        gl.uniform2f(this.sizeUniform, canvasSize[0], canvasSize[1])

        const STRIDE = ATTRIBUTE_COUNT * 4
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, STRIDE, 0)
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, STRIDE, 8)
        gl.enableVertexAttribArray(0)
        gl.enableVertexAttribArray(1)

        gl.drawArrays(gl.TRIANGLES, 0, blockCount * 6)
    }
}
