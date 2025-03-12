import { useVirtualizer } from '@tanstack/react-virtual'
import React, { useRef, useState } from 'react'
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
  const parent = useRef<HTMLDivElement>(null)

  const itemsPerRow = 10

  const rows: Array<typeof filteredChars> = []
  for (let i = 0; i < filteredChars.length; i += itemsPerRow) {
    rows.push(filteredChars.slice(i, i + itemsPerRow))
  }

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 60,
    getScrollElement: () => parent.current,
    overscan: 5
  })

  return (
    <details
      open={open}
      onToggle={() => setOpen(!open)}
      className="w-full bg-zinc-400/10 dark:bg-zinc-600/15 p-2 group"
    >
      <summary className="flex select-none">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {group.name} ({filteredChars.length})
        </h3>
      </summary>
      <div ref={parent} className="group-open:my-2 h-[360px] overflow-auto">
        <div
          className="w-full"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const rowChars = rows[virtualRow.index]

            return (
              <div
                key={virtualRow.index}
                className="flex overflow-x-auto gap-1 absolute left-0 right-0"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                {rowChars.map((char, charIndex) => {
                  const codePoint = char.codePointAt(0) || 0
                  const isInRegularSelection =
                    isSelecting &&
                    activeGroup === group.name &&
                    selectionRange.start !== null &&
                    selectionRange.end !== null &&
                    codePoint >=
                      Math.min(selectionRange.start, selectionRange.end) &&
                    codePoint <=
                      Math.max(selectionRange.start, selectionRange.end)

                  const isInAdditionalSelection =
                    additionalSelections.includes(codePoint)

                  return (
                    <GridCharButton
                      style={{ marginTop: 4 }}
                      key={charIndex}
                      char={char}
                      isInSelection={
                        isInRegularSelection || isInAdditionalSelection
                      }
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
            )
          })}
        </div>
      </div>
    </details>
  )
}
