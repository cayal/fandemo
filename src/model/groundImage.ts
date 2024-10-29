import {PSPDrainMutator, PSPLens, PSPGagReflex} from "../pspHost.ts";
import {dctII2, DCTweakerAppState} from "../dctweaking.ts";
import {Image} from "image-js";

export const GroundCanvasToInnerHTML: PSPDrainMutator<DCTweakerAppState> = (appState, ownDrain) => {
    ownDrain.innerHTML = ''
    if (appState.groundImage) {
        ownDrain.appendChild(appState.groundImage.getCanvas())
    }
}

export function GroundImageLens(covals: PSPLens<DCTweakerAppState, 'covals'>): PSPLens<DCTweakerAppState, 'groundImage'> {
    return ({
        key: 'groundImage',
        marks: ['coScope', 'drop-canvas', 'recoScope'],
        pik(bag) {
            return bag['groundImage']
        },

        put(bag, groundImage, yuck) {
            if (!groundImage) {
                return { ...bag, groundImage }
            }

            // Ground image updated, which implies covals should be
            // recomputed from them once.
            const lumas = Uint8Array.from(groundImage.data)

            const cov = dctII2(lumas, bag.editorSize ?? 0)
            console.info('(GroundImageLens) Recomputed covals.')

            const bagPrime = covals.put({
                ...bag,
                groundImage,
            }, cov, yuck)

            if (yuck) { yuck.markDirty(this.marks) }

            return bagPrime
        },

    })
}

export const SampleImageClicked: PSPGagReflex<DCTweakerAppState, PointerEvent> =
        async (e) => {
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

            const inputIm = Image.fromCanvas(_c)

            return { inputImage: inputIm }
}

export function resizeAndGreyscale(image: Image, editorSize: number): Image | string {
    try {
        const iwx = image.width;
        const iwy = image.height;

        if (iwx !== editorSize || iwy !== editorSize) {
            if (iwx !== iwy) {
                let short_edge = Math.min(iwx, iwy);
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
                    width: editorSize,
                    height: editorSize,
                })
        }

        return image.grey()
    }
    catch (e: any) { return e.message }
}
