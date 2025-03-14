import { type FC, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { FontPreview } from './components/font-preview'
import { SubsetInput } from './components/subset-input'
import { VariationAxesControls } from './components/variation-axes'
import { useDrop, useFileStore, useProcessFont } from './hooks'
import { createFallbackRenderer, Info, toTextFromUnicode } from './utils'

export const App = () => {
  const file = useDrop()
  const setFile = useFileStore(store => store.setFile)
  const [unicode, setUnicode] = useState('0-7f')

  return (
    <>
      <img
        fetchPriority="high"
        src="/background.avif"
        className="fixed -z-50 inset-0 opacity-[2%] h-full"
      />

      <nav className="col-start-6 col-span-4 sm:p-5 max-h-screen bg-gray-1 z-10">
        <SubsetInput unicode={unicode} onChange={setUnicode} />
      </nav>

      <main className="col-start-2 col-end-6 row-start-1 row-end-10 py-8 sticky top-0">
        <h1>Create a subset of your font.</h1>
        <p className="max-w-md">
          Drag and drop a font anywhere on the page.
          <span className="block">
            Your font is processed locally, and it's 🔥 blazing fast.
          </span>
        </p>

        {!file && (
          <div className="card border-1 border-dashed border-gray-6 my-6 text-center hover:bg-gray-2 transition-colors">
            <label className="text-gray-11 p-10 block">
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFile(file)
                  }
                }}
              />
              Choose a font or drop anywhere.
            </label>
          </div>
        )}
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
  const { downloadUrl, fileName, original, subset, isFetching } =
    useProcessFont(file, text)

  const info = new Info(original || null, subset || null)
  const [axes, setAxes] = useState<Record<string, number>>()

  if (isFetching) {
    return 'Creating a new subset...'
  }

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
