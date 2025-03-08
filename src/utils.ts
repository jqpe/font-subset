import prettyBytes from 'pretty-bytes'
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

  get filesize() {
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
