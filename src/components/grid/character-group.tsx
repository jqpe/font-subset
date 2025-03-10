import React, { useState } from 'react'
import { CharacterGroup as CharGroup } from './character-grouping'
import { GridCharButton } from './grid-character'

interface CharacterGroupProps {
  group: CharGroup
  isSelecting: boolean
  activeGroup: string | null
  selectionRange: { start: number | null; end: number | null }
  additionalSelections: number[]
  showOnlySupported: boolean
  isCodepointSupported: (codepoint: number) => boolean
  handlePointerDown: (codePoint: number, groupName: string) => void
  handlePointerMove: (codePoint: number, groupName: string) => void
  handlePointerUp: React.PointerEventHandler<HTMLButtonElement>
  file: File | undefined
}

export const CharacterGroupComponent: React.FC<CharacterGroupProps> = ({
  group,
  isSelecting,
  activeGroup,
  selectionRange,
  additionalSelections,
  showOnlySupported,
  isCodepointSupported,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  file
}) => {
  const [open, setOpen] = useState(false)
  const filteredChars = group.chars.filter(
    char => !showOnlySupported || isCodepointSupported(char.codePointAt(0) || 0)
  )

  return (
    <details
      open={open}
      onToggle={() => setOpen(!open)}
      className="w-full bg-gray-400/10 p-2 group"
    >
      <summary className="flex select-none">
        <h3 className="text-sm font-medium text-gray-700">
          {group.name} ({filteredChars.length})
        </h3>
      </summary>
      <div className="flex flex-wrap gap-1 group-open:my-2">
        {(open ? filteredChars : []).map(char => {
          const codePoint = char.codePointAt(0) || 0
          const isInRegularSelection =
            isSelecting &&
            activeGroup === group.name &&
            selectionRange.start !== null &&
            selectionRange.end !== null &&
            codePoint >= Math.min(selectionRange.start, selectionRange.end) &&
            codePoint <= Math.max(selectionRange.start, selectionRange.end)

          const isInAdditionalSelection =
            additionalSelections.includes(codePoint)

          return (
            <GridCharButton
              key={char}
              char={char}
              isInSelection={isInRegularSelection || isInAdditionalSelection}
              handlePointerDown={handlePointerDown}
              handlePointerUp={handlePointerUp}
              codePoint={codePoint}
              group={group}
              handlePointerMove={handlePointerMove}
              file={file}
            />
          )
        })}
      </div>
    </details>
  )
}
