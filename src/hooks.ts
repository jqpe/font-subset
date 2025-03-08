import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { subsetFont } from './lib'
import { metadata } from '../src-metadata/pkg'
import { compress } from 'woff2-encoder'

/**
 * @param unicodeRange E.g. 0000-007f or F-1F (without U+ as sometimes seen)
 * Accepts hex values of up to 4 digits in length
 */
const toTextFromUnicode = (unicodeRange: string): string => {
  const [start, end] = unicodeRange.split('-')

  const startCode = parseInt(start, 16)
  const endCode = parseInt(end, 16)

  const codes = Array.from(
    { length: endCode - startCode + 1 },
    (_, i) => startCode + i
  )

  return String.fromCharCode(...codes)
}

// https://unicode.link/blocks/basic-latin
const DEFAULT_TEXT = toTextFromUnicode('0-007F')

export const useDrop = () => {
  const [file, setFile] = useState<File>()

  useEffect(() => {
    const dropHandler = (event: DragEvent) => {
      event.stopPropagation()
      event.preventDefault()

      const files = event.dataTransfer?.files

      if (files && files.length > 0) {
        setFile([...files].at(-1))
      }
    }

    const dragOverHandler = (event: DragEvent) => {
      event.preventDefault()

      document.getElementById('root')!.dataset.isDropping = 'true'
    }

    const dragLeaveHandler = (event: DragEvent) => {
      event.preventDefault()

      document.getElementById('root')!.dataset.isDropping = 'false'
    }

    document.addEventListener('dragover', dragOverHandler)
    document.addEventListener('dragleave', dragLeaveHandler)
    document.addEventListener('drop', dropHandler)

    return () => {
      document.removeEventListener('dragover', dragOverHandler)
      document.removeEventListener('dragleave', dragLeaveHandler)
      document.removeEventListener('drop', dropHandler)
    }
  }, [])

  return file
}

export const useProcessFont = (file: File | undefined, text = DEFAULT_TEXT) => {
  const { data, isLoading } = useQuery({
    queryKey: [file?.name, file?.size, file?.lastModified, text],
    enabled: !!file,
    queryFn: async () => {
      if (!file) return null

      const {
        byteLength,
        metadata: originalMetadata,
        subset
      } = await subsetFont(await file.arrayBuffer(), text)
      const fontRawData = subset()
      const subsetMetadata = metadata(fontRawData)
      const fontCompressedData = await compress(fontRawData)

      const blob = new Blob([fontCompressedData], {
        type: 'font/woff2'
      })
      const downloadUrl = URL.createObjectURL(blob)
      const fileName = file.name.replace(/(\.[^.]+)$/, '-subset$1')

      return {
        downloadUrl,
        fileName,
        original: { metadata: originalMetadata, byteLength },
        subset: {
          metadata: subsetMetadata,
          byteLength: fontCompressedData.byteLength
        }
      }
    }
  })

  return {
    file,
    downloadUrl: data?.downloadUrl || null,
    fileName: data?.fileName || null,
    isLoading,
    original: data?.original,
    subset: data?.subset
  }
}
