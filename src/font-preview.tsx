import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'

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

  const getFontFace = async (url: string): Promise<FontFace> => {
    return url.startsWith('blob:')
      ? new FontFace('PreviewFont', await (await fetch(url)).arrayBuffer())
      : new FontFace('PreviewFont', `url(${url})`)
  }

  const editor = useEditor({
    extensions: [StarterKit, Typography],
    content: /* HTML */ `
      <h1>${sampleText}</h1>
      <h2>${sampleText}</h2>
      <h3>${sampleText}</h3>
      <h4>${sampleText}</h4>
      <h5>${sampleText}</h5>
      <h6>${sampleText}</h6>
    `
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

  // Update editor content when sampleText changes
  useEffect(() => {
    if (editor && !error) {
      editor.commands.setContent(/* HTML */ `
        <h1>${sampleText}</h1>
        <h2>${sampleText}</h2>
        <h3>${sampleText}</h3>
        <h4>${sampleText}</h4>
        <h5>${sampleText}</h5>
        <h6>${sampleText}</h6>
      `)
    }
  }, [editor, sampleText, error])

  // Cleanup function to remove the font when component unmounts
  useEffect(() => {
    return () => {
      if (fontFace && document.fonts.has(fontFace)) {
        document.fonts.delete(fontFace)
      }
    }
  }, [fontFace])

  // Generate the CSS for font-variation-settings
  const fontVariationSettingsCSS = Object.entries(variationSettings || {})
    .map(([tag, value]) => `"${tag}" ${value}`)
    .join(', ')

  return (
    <div
      className="font-preview"
      style={{ fontFamily: 'PreviewFont, AdobeBlack' }}
    >
      <style>
        {`
          .ProseMirror {
            font-variation-settings: ${fontVariationSettingsCSS}${fontVariationSettingsCSS ? ', ' : ''}"HGHT" 1000, "wdth" 1000;
          }
          
          .ProseMirror h1 {
            font-size: 2em;
          }
        `}
      </style>{' '}
      {error ? (
        <div className="error">{error}</div>
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  )
}
