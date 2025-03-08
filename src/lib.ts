import init from 'harfbuzzjs/hb-subset.wasm?init'
import { metadata } from '../src-metadata/pkg'
import { decompress } from 'woff2-encoder'
import prettyBytes from 'pretty-bytes'

const instance = await init()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hb = instance.exports as any
const heapu8 = new Uint8Array(hb.memory.buffer)

/** @see https://www.w3.org/TR/WOFF2/#woff20Header-0 */
function isWoff2Font(fontData: Uint8Array | ArrayBuffer): boolean {
  const data =
    fontData instanceof ArrayBuffer ? new Uint8Array(fontData) : fontData

  // Check for WOFF2 signature in first 4 bytes
  // WOFF2 files start with the signature 'wOF2' (0x774F4632)
  if (data.length < 4) return false

  return (
    data[0] === 0x77 && // 'w'
    data[1] === 0x4f && // 'O'
    data[2] === 0x46 && // 'F'
    data[3] === 0x32 // '2'
  )
}

interface SubsetFontResult {
  // TODO: implement TypeScript magic Rust side (doable)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
  byteLength: number
  subset: () => Uint8Array
}

/** Creates a subset of a font containing only the glyphs needed for the given text */
export async function subsetFont(
  originalFont: Uint8Array | ArrayBuffer,
  text: string,
  options: SubsetFontOptions = {}
): Promise<SubsetFontResult> {
  if (typeof text !== 'string') {
    throw new Error('The subset text must be given as a string')
  }

  let fontData =
    originalFont instanceof ArrayBuffer
      ? new Uint8Array(originalFont)
      : originalFont
  const byteLength = fontData.length

  if (isWoff2Font(originalFont)) {
    console.log('Detected font to be a woff2 font, converting to uncompressed')
    console.time('woff2-conversion')
    fontData = await decompress(originalFont)
    console.timeLog(
      'woff2-conversion',
      'original: ' + prettyBytes(originalFont.byteLength),
      'converted:' + prettyBytes(fontData.byteLength)
    )
  }

  const { fontBuffer, face, input } = initializeResources(fontData)

  configureSubsetInput(input, face, text, options)

  return {
    metadata: metadata(fontData),
    byteLength,
    subset() {
      try {
        return createSubsetFont(face, input)
      } finally {
        cleanupResources(input, face, fontBuffer)
      }
    }
  }
}

function initializeResources(fontData: Uint8Array) {
  const input = hb.hb_subset_input_create_or_fail()
  if (input === 0) {
    throw new Error('Not a valid font')
  }

  const fontBuffer = hb.malloc(fontData.byteLength)
  try {
    heapu8.set(new Uint8Array(fontData), fontBuffer)
  } catch (error) {
    if (error instanceof RangeError) {
      throw new Error('Input is too large to fit into the WASM machine')
    }

    throw error
  }

  const blob = hb.hb_blob_create(
    fontBuffer,
    fontData.byteLength,
    2, // HB_MEMORY_MODE_WRITABLE
    0,
    0
  )
  const face = hb.hb_face_create(blob, 0)
  hb.hb_blob_destroy(blob)

  return { fontBuffer, face, input }
}

function configureSubsetInput(
  input: number,
  face: number,
  text: string,
  options: SubsetFontOptions
) {
  configureLayoutFeatures(input)
  configureNameIds(input, options.preserveNameIds)
  configureLayoutClosure(input, options.noLayoutClosure)
  addUnicodeCodePoints(input, text)
  configureVariationAxes(input, face, options.variationAxes)
}

function configureLayoutFeatures(input: number) {
  // Do the equivalent of --font-features=*
  const layoutFeatures = hb.hb_subset_input_set(
    input,
    6 // HB_SUBSET_SETS_LAYOUT_FEATURE_TAG
  )
  hb.hb_set_clear(layoutFeatures)
  hb.hb_set_invert(layoutFeatures)
}

function configureNameIds(input: number, preserveNameIds?: number[]) {
  if (preserveNameIds) {
    const inputNameIds = hb.hb_subset_input_set(
      input,
      4 // HB_SUBSET_SETS_NAME_ID
    )
    for (const nameId of preserveNameIds) {
      hb.hb_set_add(inputNameIds, nameId)
    }
  }
}

function configureLayoutClosure(input: number, noLayoutClosure?: boolean) {
  if (noLayoutClosure) {
    hb.hb_subset_input_set_flags(
      input,
      hb.hb_subset_input_get_flags(input) | 0x00000200 // HB_SUBSET_FLAGS_NO_LAYOUT_CLOSURE
    )
  }
}

function addUnicodeCodePoints(input: number, text: string) {
  const inputUnicodes = hb.hb_subset_input_unicode_set(input)
  for (const c of text) {
    hb.hb_set_add(inputUnicodes, c.codePointAt(0))
  }
}

function configureVariationAxes(
  input: number,
  face: number,
  variationAxes?: Record<
    string,
    number | { min: number; max: number; default?: number }
  >
) {
  if (!variationAxes) return

  for (const [axisName, value] of Object.entries(variationAxes)) {
    if (typeof value === 'number') {
      // Simple case: Pin/instance the variation axis to a single value
      if (
        !hb.hb_subset_input_pin_axis_location(
          input,
          face,
          HB_TAG(axisName),
          value
        )
      ) {
        throw new Error(
          `hb_subset_input_pin_axis_location (harfbuzz) returned zero when pinning ${axisName} to ${value}, indicating failure. Maybe the axis does not exist in the font?`
        )
      }
    } else if (value && typeof value === 'object') {
      configureVariationAxisRange(input, face, axisName, value)
    }
  }
}

function configureVariationAxisRange(
  input: number,
  face: number,
  axisName: string,
  value: { min: number; max: number; default?: number }
) {
  // Complex case: Reduce the variation space of the axis
  if (typeof value.min === 'undefined' || typeof value.max === 'undefined') {
    throw new Error(
      `${axisName}: You must provide both a min and a max value when setting the axis range`
    )
  }

  if (
    !hb.hb_subset_input_set_axis_range(
      input,
      face,
      HB_TAG(axisName),
      value.min,
      value.max,
      // An explicit NaN makes harfbuzz use the existing default value, clamping to the new range if necessary
      value.default ?? NaN
    )
  ) {
    throw new Error(
      `Can not set the range of ${axisName} to [${value.min}; ${value.max}] with a default value of ${value.default}.\
       Maybe the axis does not exist in the font?`
    )
  }
}

function createSubsetFont(face: number, input: number): Uint8Array {
  // Create the subset
  const subset = hb.hb_subset_or_fail(face, input)
  if (subset === 0) {
    throw new Error('Subsetting failed, maybe the input file is corrupted?')
  }

  try {
    const result = hb.hb_face_reference_blob(subset)
    const offset = hb.hb_blob_get_data(result, 0)
    const subsetByteLength = hb.hb_blob_get_length(result)

    if (subsetByteLength === 0) {
      hb.hb_blob_destroy(result)
      throw new Error('Subsetting failed, maybe the input file is corrupted?')
    }

    const subsetFont = new Uint8Array(
      heapu8.subarray(offset, offset + subsetByteLength)
    )

    hb.hb_blob_destroy(result)

    return subsetFont
  } finally {
    hb.hb_face_destroy(subset)
  }
}

function cleanupResources(input: number, face: number, fontBuffer: number) {
  hb.hb_subset_input_destroy(input)
  hb.hb_face_destroy(face)
  hb.free(fontBuffer)
}

function HB_TAG(str: string): number {
  return str.split('').reduce((a, ch) => (a << 8) + ch.charCodeAt(0), 0)
}

interface SubsetFontOptions {
  preserveNameIds?: number[]
  variationAxes?: Record<
    string,
    number | { min: number; max: number; default?: number }
  >
  noLayoutClosure?: boolean
}
