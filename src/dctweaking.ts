import { Image } from 'image-js'

export const EDITOR_SIZE = 128

export async function prepareImage(ib: ArrayBufferLike | HTMLCanvasElement): Promise<Image | string> {
    let image;
    try {
        image = ib instanceof HTMLCanvasElement
            ? Image.fromCanvas(ib)
            : await Image.load(ib)
        const iwx = image.width;
        const iwy = image.height;

        if (!(iwx == EDITOR_SIZE && iwy == EDITOR_SIZE)) {
            let short_edge = Math.min(iwx, iwy);
            if (iwx > EDITOR_SIZE || iwy > EDITOR_SIZE) {
                image = image
                    .crop({
                        x: iwx / 2 - (short_edge / 2),
                        y: iwy / 2 - (short_edge / 2),
                        width: short_edge,
                        height: short_edge
                    })
            }

            image = image
                .resize({
                    width: EDITOR_SIZE,
                    height: EDITOR_SIZE
                })
        }

        const grey = image.grey()
        return grey
    }
    catch (e: any) { return e.message }
}

// Just some expensive nested loops below here

export function dctII(nums) {
    let N = nums.length

    let factor = Math.PI / N
    let result = Array(N).fill(0)
    for (let k = 0; k < N; k++) {
        for (let n = 0; n < N; n++) {
            result[k] += (nums[n] - 128) * Math.cos(factor * k * (n + 0.5))
        }
        result[k] *= k == 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N)
    }
    return result.map(k => Math.abs(k) < 1e-5 ? 0 : k)
}

export function dctII2(bytes, edgeLength) {
    let outData = Array(bytes.length).fill(0)

    for (let i = 0; i < edgeLength; i++) {
        let rowStart = i * edgeLength
        let rowEnd = i * edgeLength + edgeLength
        let rowData = Array.from(bytes.slice(rowStart, rowEnd))
        let dctr = dctII(rowData)
        for (let r = rowStart; r < rowEnd; r++) {
            outData[r] = dctr[r - rowStart]
        }
    }

    for (let j = 0; j < edgeLength; j++) {
        let colData = outData.filter((_, ci) => ci % edgeLength == j)
        let dctc = dctII(colData)
        dctc.forEach((val, rowIdx) => {
            outData[rowIdx * edgeLength + j] = val
        })
    }

    return outData;
}

export function inverseDctII2(vector: number[], edgeLength: number) {
    let outData: number[] = []

    for (let i = 0; i < edgeLength; i++) {
        let rowData = vector.slice(i * edgeLength, i * edgeLength + edgeLength)
        // outData = outData.concat(inverseDctII(rowData, window.dc_bias_x[i]))
        outData = outData.concat(inverseDctIIv3(rowData))
    }

    for (let j = 0; j < edgeLength; j++) {
        let colData = outData.filter((_, ci) => ci % edgeLength == j)
        // let colInverse = inverseDctII(colData, window.dc_bias_y[j])
        let colInverse = inverseDctIIv3(colData)
        colInverse.forEach((val, rowIdx) => {
            outData[rowIdx * edgeLength + j] = val
        })
    }

    return outData;
}

export function inverseDctIIv3(vector: number[]): number[] {
    let N = vector.length
    let factor = Math.PI / N
    let result = Array(N).fill(0)
    for (let k = 0; k < N; k++) {
        result[k] = vector[0] / Math.sqrt(N)

        for (let n = 1; n < N; n++) {
            result[k] += vector[n] * Math.cos(factor * n * (k + 0.5))
        }
        result[k] *= Math.sqrt(2 / N)
    }
    return result
}
