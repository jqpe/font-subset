export interface FontInfo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
  byteLength: number
}

interface FontMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
  byteLength: number
}

export interface ProcessedFont {
  file: File | undefined
  downloadUrl: string | null
  fileName: string | null
  isLoading: boolean
  original: FontMetadata | undefined
  subset: FontMetadata | undefined
}
