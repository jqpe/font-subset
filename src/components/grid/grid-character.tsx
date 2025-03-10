import React from 'react'
import { CharacterGroup } from './character-grouping'

interface GridCharButtonProps {
  char: string
  isInSelection: boolean
  handlePointerDown: (codePoint: number, groupName: string) => void
  codePoint: number
  group: CharacterGroup
  handlePointerMove: (codePoint: number, groupName: string) => void
  handlePointerUp: React.PointerEventHandler<HTMLButtonElement>
  file: File | undefined
}

export const GridCharButton: React.FC<GridCharButtonProps> = ({
  char,
  isInSelection,
  handlePointerDown,
  codePoint,
  group,
  handlePointerMove,
  handlePointerUp,
  file
}) => {
  return (
    <button
      data-in-selection={isInSelection}
      className={
        'flex flex-col items-center gap-1 border border-gray-300 w-8 rounded-sm p-1 transition-colors duration-300 hover:bg-red-200 data-[in-selection="true"]:bg-red-200 select-none'
      }
      onPointerDown={() => handlePointerDown(codePoint, group.name)}
      onPointerMove={() => handlePointerMove(codePoint, group.name)}
      onPointerUp={handlePointerUp}
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
