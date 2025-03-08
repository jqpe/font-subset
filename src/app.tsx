import { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { FontPreview } from './font-preview'
import { useDrop, useProcessFont } from './hooks'
import { Info } from './utils'
import { VariationAxesControls } from './variation-axes'

export const App = () => {
  const file = useDrop()

  return (
    <main>
      <h1>Chop down a subset of your font.</h1>
      <p className="max-w-md">
        Drag and drop a font anywhere on the page.
        <span className="block">
          Your font is processed locally, and it's 🔥 blazing fast.
        </span>
      </p>
      <ErrorBoundary
        resetKeys={[file]}
        fallbackRender={({ error }) => (
          <div
            role="alert"
            className="bg-red-700 text-white p-1.5 rounded-sm w-fit"
          >
            <p>{error.message}</p>
            <p>
              You dropped {file?.name} with mimetype of {file?.type}
            </p>
          </div>
        )}
      >
        <ProcessedFont file={file} />
      </ErrorBoundary>
    </main>
  )
}

const ProcessedFont = ({ file }: { file: File | undefined }) => {
  const { downloadUrl, fileName, original, subset } = useProcessFont(file)
  const info = new Info(original || null, subset || null)
  const [axes, setAxes] = useState<Record<string, number>>()

  if (!(downloadUrl && fileName)) {
    return null
  }

  return (
    <section id="download">
      <div>
        <h2>{info.name}</h2>
        <p>{info.glyphs}</p>
        <p>{info.filesize}</p>
        <VariationAxesControls
          axes={subset?.metadata.variation_axes}
          onChange={setAxes}
        />
      </div>

      <FontPreview fontUrl={downloadUrl} variationSettings={axes} />

      <a href={downloadUrl} download={fileName} className="download-button">
        Download Subset Font
      </a>
    </section>
  )
}
