import {
  Dispatch,
  FC,
  SetStateAction,
  useState,
  useRef,
  useEffect
} from 'react'
import { toTextFromUnicode } from './utils'
import { useQueryClient } from '@tanstack/react-query'

interface SubsetInputProps {
  unicode: string
  onChange: Dispatch<SetStateAction<string>>
}

interface SelectionRange {
  start: number | null
  end: number | null
}

export const SubsetInput: FC<SubsetInputProps> = ({
  unicode,
  onChange: setUnicode
}) => {
  const queryClient = useQueryClient()
  const inputClass =
    'w-1/2 lg:w-1/3 p-2 text-[1rem] border-0 rounded-md bg-gray-50 shadow-md focus-visible:outline-0 text-gray-900'

  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRange, setSelectionRange] = useState<SelectionRange>({
    start: null,
    end: null
  })
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isSelecting) {
        setIsSelecting(false)
        setSelectionRange({ start: null, end: null })
      }
    }

    window.addEventListener('pointerup', handleGlobalPointerUp)
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp)
  }, [isSelecting])

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

  const handlePointerDown = (codePoint: number) => {
    setIsSelecting(true)
    setSelectionRange({ start: codePoint, end: codePoint })
  }

  const handlePointerMove = (codePoint: number) => {
    if (isSelecting) {
      setSelectionRange(prev => ({ ...prev, end: codePoint }))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation()
    if (
      isSelecting &&
      selectionRange.start !== null &&
      selectionRange.end !== null
    ) {
      const start = Math.min(selectionRange.start, selectionRange.end)
      const end = Math.max(selectionRange.start, selectionRange.end)

      setUnicode(prev => {
        const existing = prev ? prev + ',' : ''
        return (
          existing +
          (start === end
            ? `!${start.toString(16)}`
            : `!${start.toString(16)}-${end.toString(16)}`)
        )
      })

      setIsSelecting(false)
      setSelectionRange({ start: null, end: null })
    }
  }
  return (
    <div className="my-2">
      <form
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
        <span role="separator" aria-orientation="vertical">
          or
        </span>
        <input
          onChange={e => handleTextInput(e.target.value)}
          className={inputClass}
          type="text"
          placeholder="Text"
        />
        <button type="submit" className="sr-only">
          Create font
        </button>
      </form>
      <aside className="text-xs text-gray-700 mt-2  ">
        <p>Control characters are not shown. Click or swipe to exclude.</p>
      </aside>
      <div
        ref={gridRef}
        className="gap-1 flex flex-wrap mt-4 max-w-md"
        onPointerUp={handlePointerUp}
      >
        {toTextFromUnicode(unicode)
          .split('')
          .map(char => {
            const codePoint = char.codePointAt(0) || 0
            const isInSelection =
              isSelecting &&
              selectionRange.start !== null &&
              selectionRange.end !== null &&
              codePoint >= Math.min(selectionRange.start, selectionRange.end) &&
              codePoint <= Math.max(selectionRange.start, selectionRange.end)

            return (
              <button
                key={char}
                data-in-selection={isInSelection}
                className={
                  'font-["PreviewFont",_system-ui] flex flex-col items-center gap-0.5 border border-gray-300 w-8  rounded-sm p-1 transition-all duration-300 hover:bg-red-200 data-[in-selection="true"]:bg-red-200 select-none'
                }
                onPointerDown={() => handlePointerDown(codePoint)}
                onPointerMove={() => handlePointerMove(codePoint)}
              >
                <span className="grow text-[0.7rem]">{char}</span>
                <span className="text-[0.5rem]">
                  {(char.charCodeAt(0) | 0).toString(16).padStart(4, '0')}
                </span>
              </button>
            )
          })}
      </div>
    </div>
  )
}
