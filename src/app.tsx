import { type FC, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { FontPreview } from './components/font-preview'
import { SubsetInput } from './components/subset-input'
import { VariationAxesControls } from './components/variation-axes'
import { useDrop, useProcessFont } from './hooks'
import { createFallbackRenderer, Info, toTextFromUnicode } from './utils'

export const App = () => {
  const file = useDrop()
  const [unicode, setUnicode] = useState('0-7f')

  return (
    <>
      <img
        fetchPriority="high"
        src="/background.avif"
        className="fixed -z-50 inset-0 opacity-[2%]"
      />

      <nav className="col-start-6 col-span-4 p-5 max-h-screen">
        <SubsetInput className="py-5" unicode={unicode} onChange={setUnicode} />
      </nav>

      <main className="h-full col-start-2 col-end-6 row-start-1 row-end-10 py-8 sticky top-0">
        <h1>Create a subset of your font.</h1>
        <p className="max-w-md">
          Drag and drop a font anywhere on the page.
          <span className="block">
            Your font is processed locally, and it's 🔥 blazing fast.
          </span>
        </p>

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
    <section className="flex flex-col md:grid-cols-2 gap-4 py-4 md:grid">
      <div className="card">
        <h3>{info.name}</h3>
        <p>{info.glyphs}</p>
        <p>{info.fileSize}</p>
        <a
          href={downloadUrl}
          download={fileName}
          className="block no-underline border border-gray-3 text-inherit px-2 py-0.5 text-center text-[0.7rem] rounded-full hover:bg-gray-1 transition-colors duration-300"
        >
          Download Subset
        </a>
      </div>

      <FontPreview
        key={subset?.byteLength}
        fontUrl={downloadUrl}
        variationSettings={axes}
      />

      <VariationAxesControls
        axes={subset?.metadata.variation_axes}
        onChange={setAxes}
      />
    </section>
  )
}
