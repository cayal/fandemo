import {PSPDrainMutator, PSPLens} from "../pspHost.ts";
import {DCTweakerAppState, inverseDctII2} from "../dctweaking.ts";

import {
    checksum,
    domain0toN,
    domain1toZ,
    linearCombination,
    normalizeOnAverageLuminance,
    ordinalMap,
    PostProcessor,
    sigmoidalContrastStretch
} from "./scopeCommon.ts";

const DEBUG_VERBOSE = false
const CHANNELS = ['R','G','B','A'].length

export function EditorSizeLens(
    inputImage: PSPLens<DCTweakerAppState, 'inputImage'>,
    covals: PSPLens<DCTweakerAppState, 'covals'>
): PSPLens<DCTweakerAppState, 'editorSize'> {
    return ({
        key: 'editorSize',
        marks: ['drop-canvas', 'recoScope', 'coEditorContrastControls', 'coEditorSizeControl'],
        pik(bag) {
            return bag['editorSize']
        },
        put(bag, editorSize, yuck) {
            let bagPrime;

            const nextCovals: number[] = new Array(editorSize*editorSize).fill(0);

            if (!bag.covals) {
                bagPrime = covals.put({
                    ...bag,
                    editorSize,
                }, nextCovals)


                if (yuck) { yuck.markDirty(this.marks) }

                return bagPrime
            }

            let oldEdge = Math.floor(Math.sqrt(bag.covals.length))

            // Grow behavior: Assume novel frequencies are 0
            // Shrink behavior: crop
            let smallerEdge = Math.min(editorSize, oldEdge)

            for (let y = 0; y < smallerEdge; y++) {
                for (let x = 0; x < smallerEdge; x++) {
                    nextCovals[y*editorSize + x] = bag.covals[y*oldEdge + x]
                }
            }

            if (bag.inputImage && (editorSize !== bag.editorSize)) {
                bagPrime = covals.put(
                    inputImage.put({
                    ...bag,
                    editorSize,
                }, bag.inputImage),
                nextCovals)

            } else {
                bagPrime = covals.put({
                    ...bag,
                    editorSize,
                }, nextCovals)
            }



            if (yuck) { yuck.markDirty(this.marks) }

            return bagPrime
        }
    })

}

export function CovalLens(recovals: PSPLens<DCTweakerAppState, 'recovals'>): PSPLens<DCTweakerAppState, 'covals'> {
    return ({
        key: 'covals',
        marks: ['coScope', 'recoScope', 'coEditorContrastControls'],
        pik(bag) {
            return bag['covals']
        },
        put(bag, covals, yuck) {
            const revals = inverseDctII2(covals, bag.editorSize ?? 0)
            console.info('Recomputed recovals.')
            let bagPrime = recovals.put({
                ...bag,
                covals
            }, revals, yuck)

            if (yuck) { yuck.markDirty(this.marks) }

            return bagPrime
        },
    })
}


export function CovalMouseDrawingLens(
    covals: PSPLens<DCTweakerAppState, 'covals'>,
    lastDrawnXY: PSPLens<DCTweakerAppState, 'lastDrawnXY'>
): PSPLens<DCTweakerAppState, 'mouseDrawing'> {
    return ({
        key: 'mouseDrawing',
        marks: ['coScope', 'coEditorContrastControls'],
        pik(bag) { return bag['mouseDrawing'] },
        put(bag, mouseDrawing, yuck) {
            let bagPrime = { ...bag, mouseDrawing: mouseDrawing }
            const bye = () => {
                if (yuck) { yuck.markDirty(this.marks) }
                return bagPrime
            }

            if (!bag.editorSize) {
                console.warn(`Missing editor size. Can't draw.`)
                return bye()
            }

            if (!bag.mouseXYV) {
                console.warn(`No mouse coordinates. Can't draw.`)
                return bye()
            }

            let [x, y] = bag.mouseXYV
            let novelCoordinates = ((x !== lastDrawnXY.pik(bag)?.[0]) || (y !== lastDrawnXY.pik(bag)?.[1]))

            if (!novelCoordinates) {
                console.info(`Coordinates ${bag.mouseXYV} not new from ${lastDrawnXY.pik(bag)}`)
                return bye()
            }

            let covalsPrime = covals.pik(bag)?.slice()
            if (!covalsPrime) {
                console.warn(`No covals. Can't draw.`)
                return bye()
            }

            if (mouseDrawing) {
                let offset = (y * bag.editorSize) + x

                if (!bag.coScopePaintValue) {
                    console.warn(`CovalMouseDrawingLens | Drawing with no coScopePaintValue. Investigate.`)
                }

                covalsPrime[offset] = bag.coScopePaintValue ?? 30.0

                bagPrime = lastDrawnXY.put(
                    covals.put({
                        ...bag,
                        mouseDrawing: mouseDrawing,
                    }, covalsPrime),
                    [x, y])
            }

            return bye()
        }
    })
}

export function CoScopeMouseLens(
    covals: PSPLens<DCTweakerAppState, 'covals'>,
    lastDrawnXY: PSPLens<DCTweakerAppState, 'lastDrawnXY'>
): PSPLens<DCTweakerAppState, 'mouseXYV'> {
    return ({
        key: 'mouseXYV',
        marks: ['coEditorMouseX', 'coEditorMouseY', 'coEditorMouseV'],
        pik(dataBag) {
            if (!dataBag.mouseXYV) {
                console.warn(`CoScopeMouseLens | Application state is missing mouseXYV.`)
                return null
            }
            return dataBag.mouseXYV
        },
        put(bag, wat, yuck) {
            let [x, y, v] = [wat[0], wat[1], wat[2] ?? null]

            const bye = (x, y, v) => {
                const bagPrime = { ...bag, mouseXYV: [x, y, v] }
                if (yuck) { yuck.markDirty(this.marks) }
                return bagPrime
            }

            if (!bag.editorSize) { return bye(x, y, v) }

            const offset = wat[1] * bag.editorSize + wat[0]
            let covalsPrime = covals.pik(bag)?.slice()

            if (!covalsPrime || (covalsPrime.length <= offset)) { return bye(x, y, v) }

            v ||= covalsPrime[offset]

            if (!bag.mouseDrawing) {
                return bye(x, y, v)
            }

            if (!bag.coScopePaintValue) {
                console.warn(`CoScopeMouseLens | Drawing with no coScopePaintValue. Investigate.`)
            }

            covalsPrime[offset] = bag.coScopePaintValue ?? 30.0

            const bagPrime = lastDrawnXY.put(covals.put(bag,
                                       covalsPrime),
                            [x, y])

            if (yuck) { yuck.markDirty(this.marks)}

            return {...bagPrime, mouseXYV: [x, y, v]}
        },
    })
}

export async function CoScopePeacedOut() {
    return { mouseDrawing : false }
}

export async function CoScopeMouseDown() {
    return { mouseDrawing: true }
}

export async function CoScopeMouseMoved(e) {
    const coCa = e.target;
    const rect = coCa.getBoundingClientRect();

    // Convert mouse position to canvas coordinates
    const small_left = (e.clientX - rect.left)
    const small_top = (e.clientY - rect.top)

    const x = Math.floor(small_left * (coCa.width / rect.width));
    const y = Math.floor(small_top * (coCa.height / rect.width));

    return { mouseXYV: [x, y] as [number, number] }
}

export async function CoScopePaintValuePicked(e: InputEvent): Promise<Partial<DCTweakerAppState>> {
    const target = e.target
    if (!target || !(target instanceof HTMLInputElement)) {
        console.warn(`CoScopePaintValuePicked: event target is unknown: ${e}`)
        return {}
    }

    let pickedVal: number
    try {
        pickedVal = parseFloat(target.value);
    } catch (err) {
        console.error(`Bad input element value: '${target.value}'.`)
        return {}
    }

    return { coScopePaintValue: pickedVal }
}

export async function CoScopeContrastPicked(e: InputEvent): Promise<Partial<DCTweakerAppState>> {
    const target = e.target
    if (!target || !(target instanceof HTMLInputElement)) {
        console.warn(`CoScopeContrastPicked: event target is unknown: ${e}`)
        return {}
    }

    let pickedVal: number;
    try {
        pickedVal = parseFloat(target.value);
    } catch (err) {
        console.error(`Bad input element value: '${target.value}'.`)
        return {}
    }

    const assignment = {
        'contrast-knee-picker': 'coScopeContrastKnee',
        'contrast-bump-picker': 'coScopeContrastBump',
        'contrast-power-picker': 'coScopeContrastPower',
    }[target.id]

    if (!assignment) {
        console.error(`Bag input element ID: '${target.id}'`)
        return {}
    }

    return { [assignment]: pickedVal }
}

export async function CoScopeEditorSizeChosen(e: InputEvent): Promise<Partial<DCTweakerAppState>> {
    const target = e.target
    if (!target || !(target instanceof HTMLInputElement)) {
        console.warn(`CoScopeEditorSizeChosen: event target is unknown: ${e}`)
        return {}
    }

    let pickedVal: number;
    try {
        pickedVal = parseInt(target.value);
    } catch (err) {
        console.error(`Bad input element value: '${target.value}'.`)
        return {}
    }

    return { editorSize: pickedVal }
}

export function CoScopePaintValueMutator(): PSPDrainMutator<DCTweakerAppState> {
    return async(appState, ownEl) => {
        const pvi = ownEl.querySelector('input#paint-value-picker') as HTMLInputElement
        pvi.value = appState.coScopePaintValue?.toFixed(1) ?? ''

        const pvo = ownEl.querySelector('output[for=paint-value-picker]')
        if (pvo) {
            pvo.innerHTML = appState.coScopePaintValue?.toFixed(1) ?? ''
        }
    }
}

export function CoScopeEditorSizeMutator(): PSPDrainMutator<DCTweakerAppState> {
    return async(appState, ownEl) => {
        const pvi = ownEl.querySelector('input#editor-size-picker') as HTMLInputElement
        const pvo = ownEl.querySelector('output#editor-size-output') as HTMLInputElement
        pvi.value = appState.editorSize?.toFixed(0) ?? ''
        pvo.value = appState.editorSize?.toFixed(0) ?? ''
    }
}

export function CoScopeContrastMutator(): PSPDrainMutator<DCTweakerAppState> {
    return async (appState, ownEl) => {
        const labs = ownEl.querySelectorAll('label')
        for (let lab of labs) {
            if (!appState.covals || appState.covals.length <= 0) {
                lab.classList.add('dulled')
            } else {
                lab.classList.remove('dulled')
            }
        }

        const shouldDisableSliders = !(appState?.covals && appState?.covals.length > 0)

        const inKnee = ownEl.querySelector('input#contrast-knee-picker') as HTMLInputElement
        if (inKnee) {
            inKnee.value = appState.coScopeContrastKnee?.toFixed(1) ?? ''
            inKnee.disabled = shouldDisableSliders
        }

        const knee = ownEl.querySelector('output[for=contrast-knee-picker]')
        if (knee) {
            knee.innerHTML = appState.coScopeContrastKnee?.toFixed(1) ?? ''
        }

        const inPower = ownEl.querySelector('input#contrast-power-picker') as HTMLInputElement
        if (inPower) {
            inPower.value = appState.coScopeContrastPower?.toFixed(1) ?? ''
            inPower.disabled = !(appState?.covals && appState?.covals.length > 0)
        }

        const power = ownEl.querySelector('output[for=contrast-power-picker]')
        if (power) {
            power.innerHTML = appState.coScopeContrastPower?.toFixed(1) ?? ''
        }

        const inBump = ownEl.querySelector('input#contrast-bump-picker') as HTMLInputElement
        if (inBump) {
            inBump.value = appState.coScopeContrastBump?.toFixed(1) ?? ''
            inBump.disabled = !(appState?.covals && appState?.covals.length > 0)
        }

        const bump = ownEl.querySelector('output[for=contrast-bump-picker]')
        if (bump) {
            bump.innerHTML = appState.coScopeContrastBump?.toFixed(1) ?? ''
        }
    }
}

export const CoScopeCanvasMutator = () => {
        let _lastDataChecksum: bigint = 0n
        let _lastContrastKnee: number | null = null
        let _lastContrastPower: number | null = null
        let _lastContrastBump: number | null = null
        return (appState: Partial<DCTweakerAppState>, ownDrain) => {

            const _dbi = `CoScopeCanvasMutator`

            let vals = appState['covals']
            if (!vals) {
                console.error(`${_dbi} | Values are missing from appState.`)
                return
            }

            let lck = _lastContrastKnee,
                lcp = _lastContrastPower,
                lcb = _lastContrastBump,
                chk = _lastDataChecksum
            if ((_lastContrastKnee === (lck = appState.coScopeContrastKnee ?? null))
                && (_lastContrastPower === (lcp = appState.coScopeContrastPower ?? null))
                && (_lastContrastBump === (lcp = appState.coScopeContrastBump ?? null))
                && (_lastDataChecksum === (chk = checksum(vals)))) {
                DEBUG_VERBOSE && console.info(`${_dbi} Nothing to update.`)
                return
            }

            _lastContrastKnee = lck
            _lastContrastPower = lcp
            _lastContrastBump = lcb
            _lastDataChecksum = chk

            let _canvas = ownDrain.querySelector('canvas')

            if (!_canvas) {
                console.error(`${_dbi} | No canvas to slap data into.`)
                return
            }

            _canvas.width = appState.editorSize
            _canvas.height = appState.editorSize
            let _ctx = _canvas.getContext('2d')
            if (!_ctx) {
                console.error(`${_dbi} | Failed to acquire a canvas context.`)
                return
            }

            // @ts-ignore
            _ctx.mozImageSmoothingEnabled = false
            _ctx.imageSmoothingEnabled = false

            const outData = new Uint8ClampedArray(vals.length * CHANNELS)
            let rescaled: ReturnType<PostProcessor> | null = null
            if (appState.coScopeContrastKnee && appState.groundImage && appState.editorSize) {
                rescaled = normalizeOnAverageLuminance(vals, appState.groundImage, appState.editorSize)
                    .pipe(domain0toN, 1)
                    .pipe(sigmoidalContrastStretch, appState.coScopeContrastKnee, appState.coScopeContrastPower)
                    .pipe(domain0toN, 255)
                    .pipe(linearCombination, ordinalMap, appState.coScopeContrastBump)
            } else {
                rescaled = domain1toZ(vals.slice())
                    .pipe(domain0toN, 1)
                    .pipe(sigmoidalContrastStretch, 3, 3)
                    .pipe(domain0toN, 255)
            }

            const iv: typeof vals = rescaled ? [...rescaled] : vals

            iv.forEach((x, i) => {
                outData[CHANNELS * i]     = x
                outData[CHANNELS * i + 1] = x
                outData[CHANNELS * i + 2] = x
                outData[CHANNELS * i + 3] = 255
            })

            const imData = new ImageData(outData, appState.editorSize ?? 0, appState.editorSize ?? 0)
            _ctx.putImageData(imData, 0, 0)
        }
    }
