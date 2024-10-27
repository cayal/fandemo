import { Image } from 'image-js'
import { dctII2, inverseDctII2, prepareImage } from "./dctweaking"

const EDITOR_SIZE = 128

type LensesForKeysOf<StateModel extends object> = Partial<{ [LK in keyof StateModel & string]: PSPLens<StateModel, LK> }>

/**
 * A PSP Model lets you add interactivity to some <psp-host>-hosted markup by treating every <slot> tag in the <psp-host>
 * as an outlet for a DOM-mutating function that reacts to a blob of data you define as the State Model of the 
 *
 * @param _depths Internal state object. Implements some or all of the State Model. Use the member functions to grow the model instead.
 * @param _lenses A mapping of keys of the State Model to lens object that get and set them..
 * @param _sewers A map of some DOM IDs to sewers. Each sewer has a way to build its drain (in the DOM, which will get that DOM ID), and a function from model state to sewer mutation side effects.
 * @returns 
 */
function GrowPSPModel<
    SM extends object,
    DO extends Partial<SM>,
>(
    _depths: DO = ({} as DO),
    _lenses: LensesForKeysOf<SM> = {},
    _sewers: PSPMutationSewers<string, SM> = {}
): PSPSewerModel<SM> {
    return {
        _depths,
        _lenses,
        sewers: _sewers,

        attachLens: <K extends keyof SM & string>(key: K, l: PSPLens<SM, K> = FlatLens(key), iv?: SM[K]) => {
            let _lPrime = { ..._lenses, [key]: l }
            let _dPrime = structuredClone(_depths)
            if (iv) {
                _dPrime = l.put(_depths, iv)
            }

            return GrowPSPModel(_dPrime, _lPrime, _sewers)
        },

        // PSPMutationSewers define our expectations
        mapSewers: (sewers: PSPMutationSewers<string, SM>) => {
            return GrowPSPModel(structuredClone(_depths), _lenses, sewers)
        },
        useModel: () => {
            function _markDirty(marks: PSPMutationSewer<SM>[]) {
                /**
                 * TODO #3 DOM Updates: Call these as async parallel, or instead push to 
                 * a queue that a webworker drains serially?
                 */
                for (let { mutator, drainId } of marks) {
                    const drain = document.getElementById(drainId) as HTMLElement
                    if (!drain) {
                        console.error(`_markDirty() | Can't update #${drainId}. It is no longer in the document.`)
                        continue
                    }
                    mutator(_depths, drain)
                }
            }

            return function useActions<D extends string>(actions: PSPActions<D, SM>) {
                return async ({ type, payload }: { type: D, payload: any }) => {
                    console.log("In dispatch callback")
                    let upset = await actions[type](payload)
                    for (let [key, value] of Object.entries(upset)) {
                        const updatedLens: PSPLens<SM, keyof SM> = _lenses[key]
                        if (!updatedLens) {
                            console.error(`useActions() | Can't find lens ${key}.`)
                            continue
                        }
                        _depths = updatedLens.put(_depths, value as any)
                        _markDirty(updatedLens.marks(_sewers))
                    }
                }
            }
        }
    }
}

type PSPLens<StateModel extends object, K extends keyof StateModel> = {
    key: K,

    pik: (_: Partial<StateModel>) => Partial<StateModel>[K] | null,

    put: <O>(upon: O, wat: StateModel[K]) => (O & { [_k in K]: StateModel[K] }),

    marks: <M extends PSPMutationSewers<string, StateModel>>(outlets: M) => PSPMutationSewer<StateModel>[]
}

type PSPActions<DispatchNames extends string, StateModel extends object> = {
    [dispatchName in DispatchNames]: (payload: any) => Promise<Partial<StateModel>> | Partial<StateModel>
}

const actions: PSPActions<"sampleChoice" | "coScopePoint", CosineEditorAppState> = {
    sampleChoice: prepareSampleImage,
    coScopePoint: coScopeHandlePoint,
}

type UseActions<I extends object> = <D extends string>
    (actions: PSPActions<D, I>) => (_: { type: D, payload: any }) => void

type PSPSewerModel<DataPool extends {}> = {
    _depths: Partial<DataPool>,
    _lenses: Partial<{ [LK in keyof DataPool & string]: PSPLens<DataPool, LK> }>,
    sewers: PSPMutationSewers<string, DataPool>,
    attachLens: <K extends keyof DataPool & string>(k: K, l: PSPLens<DataPool, K>, iv?: DataPool[K]) => PSPSewerModel<DataPool>,
    mapSewers: (sewers: PSPMutationSewers<string, DataPool>) => PSPSewerModel<DataPool>
    useModel: () => UseActions<DataPool>
}

type PSPMutationSewer<StateModel extends object> = {
    drainId: string,
    buildDrainElement: (ownSlot: HTMLSlotElement) => HTMLElement,
    mutator: PSPDOMDrainage<Partial<StateModel>>
}

type PSPMutationSewers<
    SlotNames extends string,
    StateModel extends object,
> = {
        [sn in SlotNames]: PSPMutationSewer<StateModel>
    }

type PSPDOMDrainage<StateModel extends object> = (curState: StateModel, drain: HTMLElement) => void



class PSPHost extends HTMLElement {
    hostEl: HTMLElement

    constructor() {
        // @ts-ignore
        const _hel = super();

        // @ts-ignore
        this.hostEl = _hel as HTMLElement;
    }

    installDrains<StateModel extends object>(sewerModel: PSPSewerModel<StateModel>) {
        if (!(this.hostEl.shadowRoot)) {
            console.error("PSP host has no shadowroot.")
            return
        }

        if (!Object.keys(sewerModel.sewers).length) {
            console.warn(`PSPHost: No sewer map when installing drains. Was a sewer map provided to the model?`)
        }

        const slots = [...this.hostEl.shadowRoot.querySelectorAll('slot')]

        for (let sewerMapSlotName of Object.keys(sewerModel.sewers)) {
            let ownedSlot: HTMLSlotElement | undefined;

            if (!(ownedSlot = slots.find(sl => sl.name == sewerMapSlotName))) {
                console.warn(this.hostEl)
                throw new RangeError(`installDrains | The host element does not contain a slot for '${sewerMapSlotName}'.`)
            }

            const sms = sewerModel.sewers[sewerMapSlotName].buildDrainElement(ownedSlot)
            sms.id = sewerModel.sewers[sewerMapSlotName].drainId
            this.hostEl.appendChild(sms)
        }
    }
}

function FlatLens<
    StateModel extends object,
    K extends keyof StateModel & string,
    V extends StateModel[K]
>(k: K, forOutlet: string = k.toString()): PSPLens<StateModel, K> {
    return ({
        key: k,
        pik(bag: Partial<StateModel>) {
            if (!(k in bag)) {
                throw new TypeError(`Missing key ${k} in ${JSON.stringify(bag)}.`)
            }

            return bag[k]
        },

        put(bag, wat) { return { ...bag, ...({ [k]: wat } as Record<K, V>) } },

        marks(sewer: PSPMutationSewers<string, StateModel>) {
            if (!sewer[forOutlet]) {
                console.warn("Can't find outlet: ", forOutlet)
                console.warn("Available: ", Object.keys(sewer))
                return []
            }
            return [sewer[forOutlet]]
        }
    })
}

function GroundImageLens(covals: PSPLens<CosineEditorAppState, 'covals'>): PSPLens<CosineEditorAppState, 'groundImage'> {
    return ({
        key: 'groundImage',
        pik(bag) {
            return bag['groundImage']
        },

        put(bag, groundImage) {
            if (!groundImage) {
                return { ...bag, groundImage }
            }

            // Ground image updated, which implies covals should be
            // recomputed from them once.
            const lumas = Uint8Array.from(groundImage.data)
            const cov = dctII2(lumas, EDITOR_SIZE)
            console.info('(GroundImageLens) Recomputed covals.')
            console.log(cov.length, cov)

            return covals.put({
                ...bag,
                groundImage,
            }, cov)
        },

        marks(outlets) { return [outlets['coScope'], outlets['drop-canvas'], outlets['recoScope']] },
    })
}

function RecovalLens(): PSPLens<CosineEditorAppState, 'recovals'> {
    return ({
        key: 'recovals',
        pik(bag) {
            return bag['covals']
        },

        put(bag, recovals) {
            return {
                ...bag,
                recovals
            }
        },

        marks(outlets) { return [outlets['recoScope']] },
    })
}

function CovalLens(recovals: PSPLens<CosineEditorAppState, 'recovals'>): PSPLens<CosineEditorAppState, 'covals'> {
    return ({
        key: 'covals',
        pik(bag) {
            return bag['covals']
        },
        put(bag, covals) {
            const revals = inverseDctII2(covals, EDITOR_SIZE)
            console.info('Recomputed recovals.')
            return recovals.put({
                ...bag,
                covals
            }, revals)
        },
        marks(outlets) {
            return [outlets['coScope'], outlets['recoScope']]
        },
    })
}

async function prepareSampleImage(e: PointerEvent) {
    if (!e.target) {
        return { errorMessage: 'Got a click, but it aint for nothin.' }
    }

    let clicked = e.target as HTMLImageElement
    if (!(e.target instanceof HTMLImageElement)) {
        return { errorMessage: 'Need an image to prepare.' }
    }

    const _c = document.createElement('canvas')

    _c.width = clicked.naturalWidth
    _c.height = clicked.naturalHeight

    const _ctx = _c.getContext('2d')
    _ctx?.drawImage(clicked, 0, 0)

    let im = await prepareImage(_c)

    if (typeof im === 'string') {
        return { errorMessage: im }
    } else {
        return { groundImage: im }
    }
}

async function coScopeHandlePoint(e) {
    const coCa = e.target;
    const rect = coCa.getBoundingClientRect();

    // Convert mouse position to canvas coordinates
    const small_left = (e.clientX - rect.left)
    const small_top = (e.clientY - rect.top)

    const x = Math.floor(small_left * (coCa.width / rect.width));
    const y = Math.floor(small_top * (coCa.height / rect.width));

    return { mouseXY: [x, y] as [number, number] }
}


type CosineEditorAppState = {
    errorMessage: string,
    mouseXY: [number, number],
    covals: number[],
    recovals: number[]
    groundImage: Image | null
}

function DivDrain(ownedSlot: HTMLSlotElement) {
    const sms = document.createElement('div')
    sms.slot = ownedSlot.name
    sms.innerHTML = ownedSlot.innerHTML
    return sms
}

customElements.define('psp-host', PSPHost)
document.addEventListener('DOMContentLoaded', () => {
    const pspHost = document.querySelector('psp-host') as PSPHost | null
    if (!pspHost) {
        console.error("No PSP host!")
        return
    }

    let sewerModel = GrowPSPModel<CosineEditorAppState, {}>({}, {}, {})

    sewerModel = sewerModel.attachLens('errorMessage', FlatLens('errorMessage'))
    sewerModel = sewerModel.attachLens('mouseXY', FlatLens('mouseXY', 'coEditorMouseX'), [0, 0])

    let rcl = RecovalLens()
    let cl = CovalLens(rcl)

    sewerModel = sewerModel.attachLens('covals', cl, [])
    sewerModel = sewerModel.attachLens('covals', rcl, [])
    sewerModel = sewerModel.attachLens('groundImage', GroundImageLens(cl), null)

    const ReplacingGroundImageCanvas = (appState, ownDrain) => {
        ownDrain.innerHTML = ''
        if (appState.groundImage) {
            ownDrain.appendChild(appState.groundImage.getCanvas())
        }
    }

    const FirstCanvasDataSlap = (stateKey: string, dbgName: string) => (appState, ownDrain) => {
        const _dbi = `SlapDataInFirstChildCanvas(${stateKey},${dbgName})`
        let _canvas = ownDrain.querySelector('canvas')

        if (!_canvas) {
            console.error(`${_dbi} | No canvas to slap data into.`)
            return
        }

        _canvas.width = EDITOR_SIZE
        _canvas.height = EDITOR_SIZE
        let _ctx = _canvas.getContext('2d')
        if (!_ctx) {
            console.error(`${_dbi} | Failed to acquire a canvas context.`)
            return
        }

        // @ts-ignore
        _ctx.mozImageSmoothingEnabled = false
        _ctx.imageSmoothingEnabled = false

        let vals = appState[stateKey]
        const outData = new Uint8ClampedArray(vals.length * 4)

        const iv = vals
        iv.forEach((v, i) => {
            outData[4 * i + 0] = v
            outData[4 * i + 1] = v
            outData[4 * i + 2] = v
            outData[4 * i + 3] = 255
        })
        console.log(_ctx)

        console.log(vals)
        console.log(vals.length, EDITOR_SIZE)
        const imData = new ImageData(outData, EDITOR_SIZE, EDITOR_SIZE)
        _ctx.putImageData(imData, 0, 0)
    }

    sewerModel = sewerModel.mapSewers({
        'drop-canvas': {
            drainId: 'drop-canvas-drain',
            buildDrainElement: DivDrain,
            mutator: ReplacingGroundImageCanvas
        },
        'coScope': {
            drainId: 'cosine-scope-drain',
            buildDrainElement: DivDrain,
            mutator: FirstCanvasDataSlap('covals', 'cosine-scope-drain')
        },
        'recoScope': {
            drainId: 'reconstruction-scope-drain',
            buildDrainElement: DivDrain,
            mutator: FirstCanvasDataSlap('recovals', 'reconstruction-scope-drain')
        },
        'coEditorMouseX': {
            drainId: 'mouse-x-drain',
            buildDrainElement: DivDrain,
            mutator: (appState, ownEl) => { ownEl.innerHTML = appState.mouseXY?.[0]?.toString() ?? '0' }
        }
    })

    const useActions = sewerModel.useModel()
    const dispatch = useActions(actions)

    pspHost.installDrains(sewerModel)

    // @ts-ignore
    window._act = (s, e) => {
        dispatch({ type: s, payload: e })
    }
})
