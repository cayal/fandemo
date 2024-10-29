import {DCTweakerAppState} from "../dctweaking.ts";
import {checksum, domain0toN, domain1toZ, PostProcessor, sigmoidalContrastStretch} from "./scopeCommon.ts";

const DEBUG_VERBOSE = false
const CHANNELS = ['R','G','B','A'].length

export const RecoScopeCanvasMutator = () => {
        let _lastDataChecksum: bigint = 0n
        let _lastContrastKnee: number | null = null
        let _lastContrastPower: number | null = null
        let _lastContrastBump: number | null = null
        return (appState: Partial<DCTweakerAppState>, ownDrain) => {

            const _dbi = `RecoScopeCanvasMutator()`

            let vals = appState['recovals']
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
            let rescaled: ReturnType<PostProcessor> = (
                domain1toZ(vals.slice())
                .pipe(domain0toN, 1)
                .pipe(sigmoidalContrastStretch, 3, 3)
                .pipe(domain0toN, 255))

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
