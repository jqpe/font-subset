import { useQuery } from '@tanstack/react-query'
import { ProcessedFont } from '../../types'

export function useFontSubset(fileName: string | undefined) {
  // Used only for cache
  const { data } = useQuery({
    queryKey: ['process-font', fileName],
    // We'll expect this to be filled by another part of the app
    queryFn: () => null as unknown as ProcessedFont,
    enabled: false,
    throwOnError: false
  })

  const fontUnicodeRanges = data?.subset?.metadata.unicode_ranges || []
  const showOnlySupported = fontUnicodeRanges.length > 0

  const isCodepointSupported = (codepoint: number) => {
    return fontUnicodeRanges.some(
      (range: { start: number; end: number }) =>
        codepoint >= range.start && codepoint <= range.end
    )
  }

  return {
    isCodepointSupported,
    showOnlySupported,
    fontMetadata: data?.subset?.metadata
  }
}
