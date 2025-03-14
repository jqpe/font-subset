/* eslint-disable no-constant-binary-expression */
import { useQueryClient } from '@tanstack/react-query'
import { Dispatch, FC, SetStateAction } from 'react'
import { Grid } from './grid'

interface SubsetInputProps {
  unicode: string
  onChange: Dispatch<SetStateAction<string>>
  className?: string
}

export const SubsetInput: FC<SubsetInputProps> = ({
  unicode,
  onChange: setUnicode,
  className
}) => {
  const queryClient = useQueryClient()
  const inputClass =
    'p-2 grow border-0 rounded-md bg-gray-3 shadow-md focus-visible:outline-0 text-gray-12'

  const isCodePointInRange = (codePoint: number, range: string) => {
    const [start, end] = range.split('-').map(x => parseInt(x, 16))
    return !end ? codePoint === start : codePoint >= start && codePoint <= end
  }

  const handleUnicodeRangeChange = (value: string) => {
    setUnicode(value)
  }

  const handleTextInput = (text: string) => {
    const ranges = unicode.split(',').map(s => s.trim())

    const newCodePoints = Array.from(text)
      .map(char => char.codePointAt(0))
      .map(code => code!.toString(16))
      .filter(code => {
        const codePoint = parseInt(code, 16)
        return !ranges.some(range => isCodePointInRange(codePoint, range))
      })

    setUnicode(prev => {
      const existing = prev.split(',').map(s => s.trim())
      return [...existing, ...newCodePoints].join(',')
    })
  }

  return (
    <div className={className}>
      <form
        className="flex items-center justify-between sticky top-2 z-10"
        onSubmit={e => {
          e.preventDefault()
          queryClient.refetchQueries()
        }}
      >
        <input
          onChange={e => handleUnicodeRangeChange(e.target.value)}
          className={inputClass}
          type="text"
          placeholder={'Enter Unicode ranges (eg. "0-7f, 0394")'}
          value={unicode}
        />
        {false && (
          <>
            <span role="separator" aria-orientation="vertical">
              or
            </span>
            <input
              onChange={e => handleTextInput(e.target.value)}
              className={inputClass}
              type="text"
              placeholder="Text"
            />
          </>
        )}
        <button
          className="flex bg-gray-1 p-1 hover:p-0.5 border border-gray-6 ml-1 shadow rounded-md max-w-8 transition-all"
          type="submit"
          aria-label="Create font"
        >
          <svg
            className="fill-gray-12 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M10 11H7.101l.001-.009a4.956 4.956 0 0 1 .752-1.787 5.054 5.054 0 0 1 2.2-1.811c.302-.128.617-.226.938-.291a5.078 5.078 0 0 1 2.018 0 4.978 4.978 0 0 1 2.525 1.361l1.416-1.412a7.036 7.036 0 0 0-2.224-1.501 6.921 6.921 0 0 0-1.315-.408 7.079 7.079 0 0 0-2.819 0 6.94 6.94 0 0 0-1.316.409 7.04 7.04 0 0 0-3.08 2.534 6.978 6.978 0 0 0-1.054 2.505c-.028.135-.043.273-.063.41H2l4 4 4-4zm4 2h2.899l-.001.008a4.976 4.976 0 0 1-2.103 3.138 4.943 4.943 0 0 1-1.787.752 5.073 5.073 0 0 1-2.017 0 4.956 4.956 0 0 1-1.787-.752 5.072 5.072 0 0 1-.74-.61L7.05 16.95a7.032 7.032 0 0 0 2.225 1.5c.424.18.867.317 1.315.408a7.07 7.07 0 0 0 2.818 0 7.031 7.031 0 0 0 4.395-2.945 6.974 6.974 0 0 0 1.053-2.503c.027-.135.043-.273.063-.41H22l-4-4-4 4z"></path>
          </svg>
        </button>
      </form>
      <aside className="text-xs text-gray-11 mt-2  ">
        <p>Control characters are not shown. Click or swipe to exclude.</p>
      </aside>
      <Grid unicode={unicode} setUnicode={setUnicode} />
    </div>
  )
}
