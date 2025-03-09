import prettyBytes from 'pretty-bytes'
import { FallbackProps } from 'react-error-boundary'
import type { FontInfo } from './types'

export class Info {
  constructor(
    protected readonly original: FontInfo | null,
    protected readonly subset: FontInfo | null
  ) {}

  get glyphs() {
    const original = this.original?.metadata.glyph_count
    const subset = this.subset?.metadata.glyph_count

    return `Glyphs: ${subset} (from ${original})`
  }

  get fileSize() {
    if (!this.original || !this.subset) return null

    const original = prettyBytes(this.original.byteLength)
    const subset = prettyBytes(this.subset.byteLength)

    return `File size: ${subset} (from ${original})`
  }

  get name() {
    return (
      this.original?.metadata.names.get(16) ??
      this.original?.metadata.names.get(1)
    )
  }
}

export const createFallbackRenderer =
  (file?: File) =>
  ({ error }: FallbackProps) => {
    const FileInfo = () => {
      if (!(file?.name && file.type)) return null

      return (
        <p>
          You dropped {file.name} with MIME type of {file.type}
        </p>
      )
    }

    return (
      <div
        role="alert"
        className="bg-red-700 text-white p-1.5 rounded-sm w-fit"
      >
        <p>{error.message}</p>
        <FileInfo />
      </div>
    )
  }

export const getFontFace = async (url: string): Promise<FontFace> => {
  return url.startsWith('blob:')
    ? new FontFace('PreviewFont', await (await fetch(url)).arrayBuffer())
    : new FontFace('PreviewFont', `url(${url})`)
}

/** @see https://www.w3.org/TR/WOFF2/#woff20Header-0 */
export const isWoff2Font = (fontData: Uint8Array | ArrayBuffer): boolean => {
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

/**
 * @param unicodeRange E.g. 0000-007f or F-1F (without U+ as sometimes seen)
 * Can also use comma-separated ranges like "0-0f, ff, 8ff-ffff"
 * Accepts hex values of up to 4 digits in length
 */
export const toTextFromUnicode = (unicodeRange: string): string => {
  const ranges = unicodeRange.split(',').map(r => r.trim())
  const includedCodes = new Set<number>()
  const excludedCodes = new Set<number>()

  ranges.forEach(range => {
    const isExclusion = range.startsWith('!')
    const cleanRange = range.replace('!', '')

    if (!cleanRange.includes('-')) {
      const code = parseInt(cleanRange, 16)
      if (isExclusion) {
        excludedCodes.add(code)
      } else {
        includedCodes.add(code)
      }
      return
    }

    const [start, end] = cleanRange.split('-')
    const startCode = parseInt(start, 16)
    const endCode = parseInt(end, 16)

    Array.from(
      { length: endCode - startCode + 1 },
      (_, i) => startCode + i
    ).forEach(code => {
      if (isExclusion) {
        excludedCodes.add(code)
      } else {
        includedCodes.add(code)
      }
    })
  })
  const finalCodes = [...includedCodes].filter(code => !excludedCodes.has(code))

  return (
    String.fromCharCode(...finalCodes)
      .match(/[^\p{Cc}]/gu)
      ?.join('') || ''
  )
}
