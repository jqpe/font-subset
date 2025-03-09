import Typography from '@tiptap/extension-typography'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React, { useEffect, useState } from 'react'
import { getFontFace } from '../utils'
import { UnicodeInput } from '../extensions/unicode-input'

interface FontPreviewProps {
  fontUrl: string
  variationSettings?: Record<string, number>
  sampleText?: string
}

export const FontPreview: React.FC<FontPreviewProps> = ({
  fontUrl,
  variationSettings = {},
  sampleText = 'The quick brown fox jumps over the lazy dog'
}) => {
  const [fontFace, setFontFace] = useState<FontFace | null>(null)
  const [error, setError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [StarterKit, Typography, UnicodeInput],
    editorProps: {
      attributes: {
        class:
          'p-2 block whitespace-pre-wrap relative focus-visible:outline-hidden'
      }
    }
  })

  // Load the font when fontUrl changes
  useEffect(() => {
    if (!fontUrl) return

    const loadFont = async () => {
      try {
        const newFontFace = await getFontFace(fontUrl)
        await newFontFace.load()
        document.fonts.add(newFontFace)
        setFontFace(newFontFace)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error('Error loading font:', err)
        setError(`Font loading error: ${errorMessage}`)
      }
    }

    loadFont()
  }, [fontUrl])

  useEffect(() => {
    if (editor && !error) {
      editor.commands.setContent(/* HTML */ ` <p>${sampleText}</p> `)
    }
  }, [editor, sampleText, error])

  useEffect(() => {
    return () => {
      if (fontFace && document.fonts.has(fontFace)) {
        console.log('deleting fontface', document.fonts.delete(fontFace))
      }
    }
  }, [fontFace])

  // TODO: modify to avoid collisions (wdth is standard for one)
  const fallbackVariations = { wdth: 1000, HGHT: 1000 } as const
  const fontVariationSettingsCSS = Object.entries({
    ...variationSettings,
    ...fallbackVariations
  })
    .map(([tag, value]) => `"${tag}" ${value}`)
    .join(', ')

  return (
    <div
      className="font-preview card"
      style={{ fontFamily: 'PreviewFont, AdobeBlack' }}
    >
      <style>
        {`
          .ProseMirror {
            font-variation-settings: ${fontVariationSettingsCSS};
          }
          
          .ProseMirror h1 {
            font-size: 2em;
          }
        `}
      </style>
      {error ? <div className='font-sans'>{error}</div> : <EditorContent editor={editor} />}
    </div>
  )
}
