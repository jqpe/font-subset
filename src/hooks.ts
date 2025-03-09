import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { compress } from 'woff2-encoder'
import { metadata } from '../src-metadata/pkg'
import { subsetFont } from './lib'
import { toTextFromUnicode } from './utils'

// https://unicode.link/blocks/basic-latin
const DEFAULT_TEXT = toTextFromUnicode('0-007F')

import { create } from 'zustand/react'

interface FileStore {
  file: File | undefined
  setFile: (file: File | undefined) => void
}

export const useFileStore = create<FileStore>()(set => ({
  file: undefined,
  setFile: file => set({ file })
}))

export const useDrop = () => {
  const { file, setFile } = useFileStore()

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
  }, [setFile])

  return file
}

export const useProcessFont = (file: File | undefined, text = DEFAULT_TEXT) => {
  const { data, isLoading } = useQuery({
    queryKey: ['process-font', file?.name],
    enabled: !!file,
    queryFn: async () => {
      if (!file) return null

      console.group(`Subsetting ${file.name}`)
      try {
        console.time('subset-total')

        const {
          byteLength,
          metadata: originalMetadata,
          subset
        } = await subsetFont(await file.arrayBuffer(), text)
        const fontRawData = subset()
        const subsetMetadata = metadata(fontRawData)

        console.time('woff2-compress')
        const fontCompressedData = await compress(fontRawData)
        console.timeEnd('woff2-compress')

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
      } finally {
        console.timeEnd('subset-total')
        console.groupEnd()
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
