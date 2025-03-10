import { FC } from 'react'
import { useFileStore } from '../../hooks'
import { CharacterGroupComponent } from './character-group'
import { filterSupportedChars, groupCharacters } from './character-grouping'
import { groupDefinitions } from './groups'
import { useCharacterSelection } from './use-character-selection'
import { useFontSubset } from './use-font-subset'

interface GridProps {
  unicode: string
  setUnicode: React.Dispatch<React.SetStateAction<string>>
}

export const Grid: FC<GridProps> = ({ unicode, setUnicode }) => {
  const file = useFileStore(state => state.file)
  const { showOnlySupported, isCodepointSupported } = useFontSubset(file?.name)

  const {
    isSelecting,
    setIsSelecting,
    selectionRange,
    setSelectionRange,
    activeGroup,
    setActiveGroup,
    swipeModifierActive,
    additionalSelections
  } = useCharacterSelection()

  // Group the characters
  const groupedChars = groupCharacters(unicode)

  // Filter for supported characters
  const filteredGroups = filterSupportedChars(
    groupedChars,
    showOnlySupported,
    isCodepointSupported
  )

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

          // Add case variants if swipe modifier is active
          if (swipeModifierActive) {
            const upperChar = char.toUpperCase()
            const lowerChar = char.toLowerCase()

            if (upperChar !== lowerChar) {
              if (char === upperChar) {
                validCodepoints.push(lowerChar.codePointAt(0)!)
              } else {
                validCodepoints.push(upperChar.codePointAt(0)!)
              }
            }
          }
        }
      }

      // Remove duplicates and sort
      const uniqueCodepoints = [...new Set(validCodepoints)].sort(
        (a, b) => a - b
      )

      const ranges: string[] = []
      let rangeStart = uniqueCodepoints[0]
      let prev = uniqueCodepoints[0]

      for (let i = 1; i <= uniqueCodepoints.length; i++) {
        const current = uniqueCodepoints[i]
        if (current !== prev + 1) {
          const rangeEnd = uniqueCodepoints[i - 1]
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

  return (
    <div className="gap-1 flex flex-wrap mt-4">
      {filteredGroups.map(group => (
        <CharacterGroupComponent
          key={group.name}
          group={group}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          isSelecting={isSelecting}
          activeGroup={activeGroup}
          selectionRange={selectionRange}
          additionalSelections={additionalSelections}
          file={file}
          showOnlySupported={showOnlySupported}
          isCodepointSupported={isCodepointSupported}
        />
      ))}
    </div>
  )
}
