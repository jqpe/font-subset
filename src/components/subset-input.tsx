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
    'p-2 grow border-0 rounded-md bg-gray-50 shadow-md focus-visible:outline-0 text-gray-900'

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
        className="flex items-center justify-between sticky top-2"
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
        <button type="submit" className="sr-only">
          Create font
        </button>
      </form>
      <aside className="text-xs text-gray-700 mt-2  ">
        <p>Control characters are not shown. Click or swipe to exclude.</p>
      </aside>
      <Grid unicode={unicode} setUnicode={setUnicode} />
    </div>
  )
}
