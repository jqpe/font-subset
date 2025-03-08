import { FC, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { FontPreview } from './font-preview'
import { useDrop, useProcessFont } from './hooks'
import { createFallbackRenderer, Info, toTextFromUnicode } from './utils'
import { VariationAxesControls } from './variation-axes'

export const App = () => {
  const file = useDrop()
  const [unicode, setUnicode] = useState('0-7f')

  return (
    <main>
      <h1>Chop down a subset of your font.</h1>
      <p className="max-w-md">
        Drag and drop a font anywhere on the page.
        <span className="block">
          Your font is processed locally, and it's 🔥 blazing fast.
        </span>
        <input
          onChange={e => setUnicode(e.target.value)}
          className="w-full "
          type="text"
          placeholder={'Enter Unicode ranges (eg. "0-7f, 0394")'}
        />
      </p>
      <div className="grid gap-0.5 grid-cols-[repeat(25,1fr)] ">
        {toTextFromUnicode(unicode)
          .split('')
          .map(char => (
            <div key={char} className="unicode-character">
              <span>{char}</span>
              <span>{char.codePointAt(0)?.toString(16).padStart(4, '0')}</span>
            </div>
          ))}
      </div>
      <ErrorBoundary
        resetKeys={[file]}
        fallbackRender={createFallbackRenderer(file)}
      >
        <ProcessedFont file={file} text={toTextFromUnicode(unicode)} />
      </ErrorBoundary>
    </main>
  )
}

interface ProcessedFontProps {
  file: File | undefined
  text?: string
}
const ProcessedFont: FC<ProcessedFontProps> = ({ file, text }) => {
  const { downloadUrl, fileName, original, subset, isLoading } = useProcessFont(
    file,
    text
  )

  const info = new Info(original || null, subset || null)
  const [axes, setAxes] = useState<Record<string, number>>()

  if (isLoading) return 'Creating a subset...'

  if (!(downloadUrl && fileName)) {
    return null
  }

  return (
    <section id="download">
      <div className="card">
        <h3>{info.name}</h3>
        <p>{info.glyphs}</p>
        <p>{info.fileSize}</p>
      </div>

      <VariationAxesControls
        axes={subset?.metadata.variation_axes}
        onChange={setAxes}
      />

      <FontPreview fontUrl={downloadUrl} variationSettings={axes} />

      <a href={downloadUrl} download={fileName} className="download-button">
        Download Subset Font
      </a>
    </section>
  )
}
