import { type FC, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { FontPreview } from './font-preview'
import { useDrop, useProcessFont } from './hooks'
import { createFallbackRenderer, Info, toTextFromUnicode } from './utils'
import { VariationAxesControls } from './variation-axes'
import { SubsetInput } from './subset-input'

export const App = () => {
  const file = useDrop()
  const [unicode, setUnicode] = useState('0-7f')

  return (
    <>
      <main>
        <h1>Create a subset of your font.</h1>
        <p className="max-w-md">
          Drag and drop a font anywhere on the page.
          <span className="block">
            Your font is processed locally, and it's 🔥 blazing fast.
          </span>
        </p>

        <SubsetInput unicode={unicode} onChange={setUnicode} />

        <ErrorBoundary
          resetKeys={[file]}
          fallbackRender={createFallbackRenderer(file)}
        >
          <ProcessedFont file={file} text={toTextFromUnicode(unicode)} />
        </ErrorBoundary>
      </main>
    </>
  )
}
interface ProcessedFontProps {
  file: File | undefined
  text?: string
}
const ProcessedFont: FC<ProcessedFontProps> = ({ file, text }) => {
  const { downloadUrl, fileName, original, subset } = useProcessFont(file, text)

  const info = new Info(original || null, subset || null)
  const [axes, setAxes] = useState<Record<string, number>>()

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
