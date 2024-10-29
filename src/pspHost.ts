const DEBUG_MARK_DIRTY = false

/**
 * A PSP Model lets you add interactivity to some <psp-host>-hosted markup by treating every <slot> tag in the <psp-host>
 * as an outlet for a DOM-mutating function that reacts to a blob of data you define as the State Model of the 
 *
 * @param _depths Internal state object. Implements some or all of the State Model. Use the member functions to grow the model instead.
 * @param _lenses A mapping of keys of the State Model to lens object that get and set them..
 * @param _sewers A map of some DOM IDs to sewers. Each sewer has a way to build its drain (in the DOM, which will get that DOM ID), and a function from model state to sewer mutation side effects.
 * @returns 
 */
export function GrowPSPModel<
    SM extends object,
    DO extends Partial<SM>,
>(
    _depths: DO = ({} as DO),
    _lenses: Partial<{ [LK in keyof SM & string]: PSPLens<SM, LK> }> = {},
    _sewers: PSPMutationSewers<string, SM> = {}
): PSPSewerModel<SM> {
    return {
        _depths,
        _lenses,
        sewers: _sewers,

        attachLens: <K extends keyof SM & string>(key: K, l: PSPLens<SM, K> = FlatLens(key), iv?: SM[K]) => {
            let _lPrime = { ..._lenses, [key]: l }
            let _dPrime = structuredClone(_depths)
            if (typeof iv !== "undefined") {
                _dPrime = l.put(_depths, iv)
            }

            return GrowPSPModel(_dPrime, _lPrime, _sewers)
        },

        // PSPMutationSewers define our expectations
        mapSewers: (sewers: PSPMutationSewers<string, SM>) => {
            return GrowPSPModel(structuredClone(_depths), _lenses, sewers)
        },
        useModel: () => {
            const yuck: PSPYuckFlusher = {
                dirtySet: new Set<string>(),
                markDirty(marks: string[]) {
                    const foundSewerNames = marks.filter(m => m in _sewers)
                    if (foundSewerNames.length !== marks.length) {
                        const missing = marks.filter(m => !(m in _sewers))
                        console.warn(`_markDirty() | A lens is trying to mark a missing sewer: ${missing}.`)
                    }

                    foundSewerNames.forEach(x => this.dirtySet.add(x))
                },
                flush() {
                    let markables: PSPMutationSewer<SM>[] = []
                    for (let dirtyName of this.dirtySet) {
                        markables.push(_sewers[dirtyName])
                    }

                    for (let { mutator, drainId } of markables) {
                        const drain = document.getElementById(drainId) as HTMLElement
                        if (!drain) {
                            console.error(`_markDirty() | Can't update #${drainId}. It is no longer in the document.`)
                            continue
                        }
                        DEBUG_MARK_DIRTY && console.log("Going to mark dirty: ", drain.id, drainId);
                        mutator(_depths, drain)
                    }
                }
            }

            return function useActions<D extends string>(actions: PSPActions<D, SM>) {
                return async ({ type, payload }: { type: D, payload: any }) => {
                    let upset = await actions[type](payload)
                    for (let [key, value] of Object.entries(upset)) {
                        const updatedLens: PSPLens<SM, keyof SM> = _lenses[key]
                        if (!updatedLens) {
                            console.error(`useActions() | Can't find lens ${key}.`)
                            continue
                        }
                        _depths = updatedLens.put(_depths, value as any, yuck)
                    }
                    yuck.flush()
                }
            }
        }
    }
}

interface PSPYuckFlusher {
    dirtySet: Set<string>,
    markDirty: (marks: string[]) => void,
    flush: () => void
}

/**
 * A simple key-value getter/setter with no changes to other places.
 * @param k 
 * @param forOutlets
 * @returns 
 */
export function FlatLens<
    SM extends object,
    K extends keyof SM & string,
    V extends SM[K]
>(k: K, forOutlets: string[] = [k.toString()]): PSPLens<SM, K> {
    return ({
        key: k,
        marks: forOutlets,
        pik(bag: Partial<SM>) {
            if (!(k in bag)) {
                throw new TypeError(`Missing key ${k} in data bag. ` +
                    `Consider adding an initalizer in the call to attachLens(${k}).` +
                    `Known keys: ${Object.keys(bag)}.`)
            }

            return bag[k]
        },

        put(bag, wat, yuck) {
            const _statePrime = { ...bag, ...({ [k]: wat } as Record<K, V>) }

            if (yuck) { yuck.markDirty(this.marks) }

            return _statePrime
        },
    })
}

export function DivDrain(ownedSlot: HTMLSlotElement) {
    const sms = document.createElement('div')
    sms.slot = ownedSlot.name
    sms.innerHTML = ownedSlot.innerHTML
    return sms
}


export class PSPHost extends HTMLElement {
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

            const dirtyingLenses: PSPLens<StateModel, keyof StateModel>[] = (Object
                .values(sewerModel._lenses)
                .filter((l: any) => l.marks.includes(sewerMapSlotName)) as PSPLens<StateModel, keyof StateModel>[])

            if (dirtyingLenses.length > 0) {
                sewerModel.sewers[sewerMapSlotName].mutator(sewerModel._depths, sms)
            }
        }
    }
}


export interface PSPLens<StateModel extends object, K extends keyof StateModel> {
    key: K,

    /**
     * Given a bag of data, pick a record out from it.
     *
     * @param dataBag Some object-type bag of data, hopefully implementing all of StateModel
     * @returns The K record's value from dataBag, or null if key K is missing.
     */
    pik: (dataBag: Partial<StateModel>) => Partial<StateModel>[K] | null,

    /**
     * Given a lump of data and a value, do whatever to build a new lump that has the value
     * represented within it.
     *
     * @param from The object to 'act upon' (even though this returns a new object)
     * @param wat The value that's getting updated at key K. Other values might get updated too.
     * @returns A new lump of data with the update to key K represented.
     */
    put: <O extends Partial<StateModel>>(
        from: O,
        wat: StateModel[K],
        yucky?: PSPYuckFlusher
    ) => (O & { [_k in K]: StateModel[K] }),

    /**
     * The list of sewer names that need to update in response to changes of K.
     */
    marks: string[]
}

/**
 * List different sorts of actions the user can take as the keys of the PSPActions object, and give
 * functions from any kind of action data to updated State Model records as the values. These functions
 * can be async.
 *
 * Example:
 * ```
 * const myChessActions = {
 *   clickedChessboard: async function computeActiveSquare(MouseEvent: e) => { ... return { activeSquare: "E5" } },
 *   typedInChatWindow: function updateChatBoxState({ change: 'add', data: 'g' }) => { ... return { chatBoxContent: 'welp gg' },
 * }
 * ```
 */
export type PSPGagReflex<StateModel, P> = (payload: P) => Promise<Partial<StateModel>> | Partial<StateModel>
export type PSPActions<StimulusNames extends string, StateModel extends object> = {
    [dispatchName in StimulusNames]: PSPGagReflex<StateModel, any>
}

/**
 * Takes the actions object and gives you a dispatch function that you can use to fire them off.
 */
export type UseActions<I extends object> = <D extends string>
    (actions: PSPActions<D, I>) => (_: { type: D, payload: any }) => void

export type PSPSewerModel<DataPool extends {}> = {
    _depths: Partial<DataPool>,
    _lenses: Partial<{ [LK in keyof DataPool & string]: PSPLens<DataPool, LK> }>,
    sewers: PSPMutationSewers<string, DataPool>,
    attachLens: <K extends keyof DataPool & string>(k: K, l: PSPLens<DataPool, K>, iv?: DataPool[K]) => PSPSewerModel<DataPool>,
    mapSewers: (sewers: PSPMutationSewers<string, DataPool>) => PSPSewerModel<DataPool>
    useModel: () => UseActions<DataPool>
}

export type PSPDrainMutator<StateModel> = (curState: Partial<StateModel>, drain: HTMLElement) => void | Promise<void>
export type PSPMutationSewer<StateModel extends object> = {
    drainId: string,
    buildDrainElement: (ownSlot: HTMLSlotElement) => HTMLElement,
    mutator: PSPDrainMutator<StateModel>
}


export type PSPMutationSewers<
    SlotNames extends string,
    StateModel extends object,
> = {
        [sn in SlotNames]: PSPMutationSewer<StateModel>
    }