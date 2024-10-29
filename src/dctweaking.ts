import { Image } from 'image-js'
import {DivDrain, FlatLens, GrowPSPModel, PSPActions, PSPGagReflex, PSPHost, PSPLens} from './pspHost'
import {GroundCanvasToInnerHTML, GroundImageLens, resizeAndGreyscale, SampleImageClicked} from "./model/groundImage.ts";
import {
    CoScopeMouseLens,
    CoScopeContrastPicked,
    CoScopeContrastMutator,
    CoScopeMouseMoved,
    CoScopeCanvasMutator,
    CovalLens,
    CoScopeMouseDown,
    CovalMouseDrawingLens,
    CoScopeEditorSizeChosen,
    EditorSizeLens,
    CoScopePeacedOut,
    CoScopePaintValuePicked, CoScopePaintValueMutator, CoScopeEditorSizeMutator
} from "./model/coScope.ts";
import { RecoScopeCanvasMutator } from "./model/recoScope.ts";

const DEFAULT_EDITOR_SIZE = 64

export type DCTweakerAppState = {
    inputImage: Image | null
    groundImage: Image | null
    editorSize: number
    errorMessage: string
    mouseXYV: [number, number, number?]
    covals: number[]
    coScopeContrastKnee: number
    coScopeContrastPower: number
    coScopeContrastBump: number
    coScopePaintValue: number
    recovals: number[]
    mouseDrawing: boolean,
    lastDrawnXY: [number, number],
}

const CanvasResetRequested: PSPGagReflex<DCTweakerAppState, {editorSize: number}> =  ( {editorSize}) => {
    return {
        editorSize: editorSize,
        covals: Array(editorSize*editorSize).fill(0),
    }
}

type DCTweakerActions =
    | "resetCanvas"
    | "editorSizeChoice"
    | "sampleChoice"
    | "coScopeMove"
    | "coScopeDown"
    | "coScopePeace"
    | "contrastPicker"
    | "paintValuePicker"

const actions: PSPActions<DCTweakerActions, DCTweakerAppState> = {
    resetCanvas: CanvasResetRequested,
    sampleChoice: SampleImageClicked,
    coScopeMove: CoScopeMouseMoved,
    coScopeDown: CoScopeMouseDown,
    coScopePeace: CoScopePeacedOut,
    contrastPicker: CoScopeContrastPicked,
    editorSizeChoice: CoScopeEditorSizeChosen,
    paintValuePicker: CoScopePaintValuePicked,
}

customElements.define('psp-host', PSPHost)

document.addEventListener('DOMContentLoaded', () => {
    const pspHost = document.querySelector('psp-host') as PSPHost | null
    if (!pspHost) {
        console.error("No PSP host!")
        return
    }

    let sewerModel = GrowPSPModel<DCTweakerAppState, {}>({}, {}, {})

    sewerModel = sewerModel.attachLens('errorMessage', FlatLens('errorMessage'))

    let rcl = RecovalLens()
    let cl = CovalLens(rcl)

    let ccl = FlatLens<DCTweakerAppState, 'coScopeContrastKnee', number>('coScopeContrastKnee', [])
    sewerModel = sewerModel.attachLens('coScopeContrastKnee', ccl, 0.5)

    let ccpl = FlatLens<DCTweakerAppState, 'coScopeContrastPower', number>('coScopeContrastPower', [])
    sewerModel = sewerModel.attachLens('coScopeContrastPower', ccpl, 5)

    let ccbl = FlatLens<DCTweakerAppState, 'coScopeContrastBump', number>('coScopeContrastBump', [])
    sewerModel = sewerModel.attachLens('coScopeContrastBump', ccbl, 0)

    sewerModel = sewerModel.attachLens('covals', cl, [])

    let ldxyl = FlatLens<DCTweakerAppState, 'lastDrawnXY', [number, number]>('lastDrawnXY', [])
    sewerModel = sewerModel.attachLens('lastDrawnXY', ldxyl, [-1, -1])

    let cidl = CovalMouseDrawingLens(cl, ldxyl)
    sewerModel = sewerModel.attachLens('mouseDrawing', cidl, false)
    sewerModel = sewerModel.attachLens('mouseXYV', CoScopeMouseLens(cl, ldxyl), [0, 0])

    sewerModel = sewerModel.attachLens('recovals', rcl, [])

    let gil = GroundImageLens(cl)
    let iil = InputImageLens(gil)
    sewerModel = sewerModel.attachLens('groundImage', gil, null)
    sewerModel = sewerModel.attachLens('inputImage', iil, null)
    sewerModel = sewerModel.attachLens('editorSize', EditorSizeLens(iil, cl), DEFAULT_EDITOR_SIZE)
    sewerModel = sewerModel.attachLens('coScopePaintValue', FlatLens('coScopePaintValue', ['coEditorPaintValuePicker']), 30.0)

    sewerModel = sewerModel.mapSewers({
        'drop-canvas': {
            drainId: 'drop-canvas-drain',
            buildDrainElement: DivDrain,
            mutator: GroundCanvasToInnerHTML
        },
        'coScope': {
            drainId: 'cosine-scope-drain',
            buildDrainElement: DivDrain,
            mutator: CoScopeCanvasMutator()
        },
        'recoScope': {
            drainId: 'reconstruction-scope-drain',
            buildDrainElement: DivDrain,
            mutator: RecoScopeCanvasMutator()
        },
        'coEditorMouseX': {
            drainId: 'mouse-x-drain',
            buildDrainElement: DivDrain,
            mutator: (appState, ownEl) => { ownEl.innerHTML = appState.mouseXYV?.[0]?.toString() ?? '0' }
        },
        'coEditorMouseY': {
            drainId: 'mouse-y-drain',
            buildDrainElement: DivDrain,
            mutator: (appState, ownEl) => { ownEl.innerHTML = appState.mouseXYV?.[1]?.toString() ?? '0' }
        },
        'coEditorMouseV': {
            drainId: 'mouse-v-drain',
            buildDrainElement: DivDrain,
            mutator: (appState, ownEl) => { ownEl.innerHTML = appState.mouseXYV?.[2]?.toString() ?? 'ø' }
        },
        'coEditorContrastControls': {
            drainId: 'cosine-contrast-control-drain',
            buildDrainElement: DivDrain,
            mutator: CoScopeContrastMutator()
        },
        'coEditorPaintValuePicker': {
            drainId: 'cosine-editor-paint-value-drain',
            buildDrainElement: DivDrain,
            mutator: CoScopePaintValueMutator()
        },
        'coEditorSizeControl': {
            drainId: 'cosine-editor-size-control-drain',
            buildDrainElement: DivDrain,
            mutator: CoScopeEditorSizeMutator()
        }
    })

    const useActions = sewerModel.useModel()
    const dispatch = useActions(actions)

    pspHost.installDrains(sewerModel)

    dispatch({ type: 'resetCanvas', payload: { editorSize: 64 }})

    // @ts-ignore
    window._act = (s, e) => {
        dispatch({ type: s, payload: e })
    }
})

function InputImageLens(
    groundImage: PSPLens<DCTweakerAppState, 'groundImage'>
): PSPLens<DCTweakerAppState, 'inputImage'> {

    return {
        key: 'inputImage',
        marks: ['drop-canvas', 'coScope, recoScope'],
        pik(bag) {
            return bag.inputImage
        },
        put(bag, inputIm) {
            if (!inputIm) { return { ...bag, inputImage: null } }

            let im = resizeAndGreyscale(inputIm, bag.editorSize ?? DEFAULT_EDITOR_SIZE)

            if (typeof im === 'string') {
                return {
                    ...bag,
                    inputImage: null,
                    errorMessage: im
                }
            } else {
                return groundImage.put({
                    ...bag,
                    inputImage: inputIm,
                }, im)
            }
        }
    }
}


function RecovalLens(): PSPLens<DCTweakerAppState, 'recovals'> {
    return ({
        key: 'recovals',
        marks: ['recoScope'],
        pik(bag) {
            return bag['covals']
        },

        put(bag, recovals, yuck) {
            const bagPrime = { ...bag, recovals, markDirty: yuck }

            if (yuck) { yuck.markDirty(this.marks) }

            return bagPrime
        },

    })
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
