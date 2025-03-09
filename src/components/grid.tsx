import { useQuery } from '@tanstack/react-query'
import {
  type Dispatch,
  type FC,
  type SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react'
import { useFileStore } from '../hooks'
import { ProcessedFont } from '../types'
import { toTextFromUnicode } from '../utils'
import { groupDefinitions, otherSymbolsPattern } from './groups'

interface GridProps {
  unicode: string
  setUnicode: Dispatch<SetStateAction<string>>
}

interface SelectionRange {
  start: number | null
  end: number | null
}

interface CharacterGroup {
  name: string
  chars: string[]
  pattern: RegExp
}

export const Grid: FC<GridProps> = ({ unicode, setUnicode }) => {
  const file = useFileStore(state => state.file)
  // Used only for cache
  const { data } = useQuery({
    queryKey: ['process-font', file?.name],
    // @ts-expect-error Never used
    queryFn: () => null as ProcessedFont,
    enabled: false,
    throwOnError: false
  })

  const fontUnicodeRanges = data?.subset?.metadata.unicode_ranges || []

  const showOnlySupported = fontUnicodeRanges.length > 0

  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRange, setSelectionRange] = useState<SelectionRange>({
    start: null,
    end: null
  })
  const ref = useRef<HTMLDivElement>(null)

  const isCodepointSupported = (codepoint: number) => {
    return fontUnicodeRanges.some(
      (range: { start: number; end: number }) =>
        codepoint >= range.start && codepoint <= range.end
    )
  }

  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const groupedChars = toTextFromUnicode(unicode)
    .split('')
    .reduce((acc, char) => {
      // Find the first matching group definition
      const matchingGroup = groupDefinitions.find(({ pattern }) =>
        pattern.test(char)
      )

      if (matchingGroup) {
        const { name, pattern } = matchingGroup
        const existingGroup = acc.find(g => g.name === name)
        if (existingGroup) {
          existingGroup.chars.push(char)
        } else {
          acc.push({ name, pattern, chars: [char] })
        }
      } else {
        // Handle ungrouped characters
        const otherGroup = acc.find(g => g.name === 'Other')
        if (otherGroup) {
          otherGroup.chars.push(char)
        } else {
          acc.push({
            name: 'Other',
            pattern: otherSymbolsPattern,
            chars: [char]
          })
        }
      }

      return acc
    }, [] as CharacterGroup[])

  groupedChars.forEach(group => {
    group.chars.sort(
      (a, b) => (a.codePointAt(0) || 0) - (b.codePointAt(0) || 0)
    )
  })

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

  const handlePointerDown = (codePoint: number, groupName: string) => {
    setActiveGroup(groupName)
    setIsSelecting(true)
    setSelectionRange({ start: codePoint, end: codePoint })
  }

  const handlePointerMove = (codePoint: number, groupName: string) => {
    if (isSelecting && activeGroup === groupName) {
      setSelectionRange(prev => ({ ...prev, end: codePoint }))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation()
    if (
      isSelecting &&
      selectionRange.start !== null &&
      selectionRange.end !== null &&
      activeGroup
    ) {
      const start = Math.min(selectionRange.start, selectionRange.end)
      const end = Math.max(selectionRange.start, selectionRange.end)

      const groupPattern = groupDefinitions.find(
        g => g.name === activeGroup
      )?.pattern

      const validCodepoints = []
      for (let cp = start; cp <= end; cp++) {
        const char = String.fromCodePoint(cp)
        if (groupPattern?.test(char)) {
          validCodepoints.push(cp)
        }
      }

      const ranges: string[] = []
      let rangeStart = validCodepoints[0]
      let prev = validCodepoints[0]

      for (let i = 1; i <= validCodepoints.length; i++) {
        const current = validCodepoints[i]
        if (current !== prev + 1) {
          const rangeEnd = validCodepoints[i - 1]
          ranges.push(
            rangeStart === rangeEnd
              ? `!${rangeStart.toString(16)}`
              : `!${rangeStart.toString(16)}-${rangeEnd.toString(16)}`
          )
          rangeStart = current
        }
        prev = current
      }

      setUnicode(prev => {
        const existing = prev ? prev + ',' : ''
        return existing + ranges.join(',')
      })

      setIsSelecting(false)
      setSelectionRange({ start: null, end: null })
      setActiveGroup(null)
    }
  }

  const filteredGroups = groupedChars.filter(group => {
    const visibleChars = group.chars.filter(
      char =>
        !showOnlySupported || isCodepointSupported(char.codePointAt(0) || 0)
    )
    return visibleChars.length > 0
  })

  return (
    <div
      ref={ref}
      className="gap-1 flex flex-wrap mt-4"
      onPointerUp={handlePointerUp}
    >
      {filteredGroups.map(group => (
        <div key={group.name} className="space-y-2 w-full my-2">
          <h3 className="text-sm font-medium text-gray-700">
            {group.name} (
            {
              group.chars.filter(
                char =>
                  !showOnlySupported ||
                  isCodepointSupported(char.codePointAt(0) || 0)
              ).length
            }
            )
          </h3>
          <div className="flex flex-wrap  gap-1">
            {group.chars
              .filter(
                char =>
                  !showOnlySupported ||
                  isCodepointSupported(char.codePointAt(0) || 0)
              )
              .map(char => {
                const codePoint = char.codePointAt(0) || 0
                const isInSelection =
                  isSelecting &&
                  activeGroup === group.name &&
                  selectionRange.start !== null &&
                  selectionRange.end !== null &&
                  codePoint >=
                    Math.min(selectionRange.start, selectionRange.end) &&
                  codePoint <=
                    Math.max(selectionRange.start, selectionRange.end)

                return (
                  <GridCharButton
                    key={char}
                    char={char}
                    isInSelection={isInSelection}
                    handlePointerDown={handlePointerDown}
                    codePoint={codePoint}
                    group={group}
                    handlePointerMove={handlePointerMove}
                    file={file}
                  />
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}

interface GridCharButtonProps {
  char: string
  isInSelection: boolean
  handlePointerDown: (codePoint: number, groupName: string) => void
  codePoint: number
  group: CharacterGroup
  handlePointerMove: (codePoint: number, groupName: string) => void
  file: File | undefined
}

const GridCharButton: React.FC<GridCharButtonProps> = ({
  char,
  isInSelection,
  handlePointerDown,
  codePoint,
  group,
  handlePointerMove,
  file
}) => {
  return (
    <button
      data-in-selection={isInSelection}
      className={
        'flex flex-col items-center gap-0.5 border border-gray-300 w-8 rounded-sm p-1 transition-colors duration-300 hover:bg-red-200 data-[in-selection="true"]:bg-red-200 select-none'
      }
      onPointerDown={() => handlePointerDown(codePoint, group.name)}
      onPointerMove={() => handlePointerMove(codePoint, group.name)}
    >
      <span
        className={`grow text-[0.7rem] ${file?.name ? 'font-["PreviewFont",AdobeBlack]' : 'system-ui'} `}
      >
        {char}
      </span>
      <span className="text-[0.5rem]">
        {(char.charCodeAt(0) | 0).toString(16).padStart(4, '0')}
      </span>
    </button>
  )
}
