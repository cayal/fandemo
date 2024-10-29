import {Image} from "image-js";

export type PostProcessor = (vals: number[], ...args: any[]) => PostProcessed
export type PostProcessed = ({
    one: (x: number, i?: number) => number
    pipe: (nextP: PostProcessor, ...nextArgs: any[]) => PostProcessed
    [Symbol.iterator]: () => Generator<number>
})

export function PostProcessable(vals: number[], one: (x: number) => number): PostProcessed {
    return {
        one,
        pipe: (nextP: PostProcessor, ...nextArgs: any[]) => {
            return nextP(vals.map(one), ...nextArgs)
        },
        [Symbol.iterator]: function*() {
            yield* vals.map(one)
        }
    }
}

export function log(vals: number[], power: number): PostProcessed {
    return PostProcessable(vals, (x: number) => Math.log(x))
}

export function domain1toZ(vals: number[]): PostProcessed {
    let min = Math.min(...vals)
    let one = (x: number) => x + (1 - min)
    return PostProcessable(vals, one)
}

export function domain0toN(vals: number[], n: number): PostProcessed {
    let min = Math.min(...vals)
    let max = Math.max(...vals)
    let one = (x: number) => {
        const res = (max-min === 0
            ? 0.5
            : ((x - min) / (max - min)) * n)
        if (isNaN(res)) { console.warn('domain0toN', x)}
        return res
    }

    return PostProcessable(vals, one)
}


export function ordinalMap(vals: number[]): PostProcessed {
    const sorted = vals.slice().sort()
    const colors = Array(vals.length).fill(0).map((_, i) => Math.floor(255*i/vals.length))

    const bs = (term: number, start=0, end=sorted.length-1) => {
        if (start >= end) {
            return start
        }
        const m = Math.floor((start+end) / 2)
        return (sorted[m] < term
            ? bs(term, m+1, end)
            : bs(term, start, m))
    }

    let one = (x: number) => {
        if (typeof colors[bs(x)] === 'undefined'){
            console.warn(' UhOH!', x, bs(x), colors)
        }
        return colors[bs(x)]
    }
    return PostProcessable(vals, one)
}

// Copped from https://usage.imagemagick.org/color_mods/#sigmoidal
export function sigmoidalContrastStretch(vals: number[], cutoff: number, gain: number): PostProcessed {
    let one = (z: number) => {
        const res = 1 / (1 + Math.exp(-cutoff*z + gain))
        return res
    }

    return PostProcessable(vals, one)
}

export function normalizeOnAverageLuminance(vals: number[], groundImage: Image, editorSize: number): PostProcessed {
    const lumas = Array.from(groundImage.data)
    const min = Math.min(...lumas)
    const avg: number = lumas.reduce((acc, x) => acc+x, 0) / lumas.length
    const power = avg

    let one = (z: number) => {
        const zplus = z - min
        return ((zplus - avg) / power) / editorSize
    }
    return PostProcessable(vals, one)
}

export function linearCombination(vals: number[], into: PostProcessor, ratio: number=0.5): PostProcessed {
    let intoer = into(vals)
    let one = (u: number) => {
        const a = intoer.one(u)
        return (a * ratio) + (u * (1 - ratio))
    }

    return PostProcessable(vals, one)
}

// The "longitudinal parity check". The weakness, swapping of values
// and two-bit-wise positionally similar changes, are unlikely cases
// since the user edits one byte at a time with a low degree of precision.
export function checksum(vals: number[]): bigint {
    let parity = BigInt.asUintN(64, 0n)
    let f64vals = Float64Array.from(vals)
    let dv = new DataView(f64vals.buffer)
    for (let i = 0; i < f64vals.byteLength; i += 8) {
        let val = dv.getBigUint64(i)
        parity = BigInt.asUintN(64, parity ^ val)
    }

    return parity
}