import { cx } from 'cva'
import React, { CSSProperties } from 'react'
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
  style: CSSProperties
}

export const GridCharButton: React.FC<GridCharButtonProps> = ({
  char,
  isInSelection,
  handlePointerDown,
  codePoint,
  group,
  handlePointerMove,
  handlePointerUp,
  file,
  style
}) => {
  return (
    <button
      style={style}
      data-in-selection={isInSelection}
      className={cx(
        'flex flex-col items-center gap-1 border bg-gray-2 border-gray-6',
        'w-8 rounded-sm p-1 transition-[background] duration-300 select-none',
        'hover:bg-red-4 data-[in-selection="true"]:bg-red-4',
        'hover:border-red-8 data-[in-selection="true"]:border-red-8',
        'focus-visible:outline-red-8 '
      )}
      onPointerDown={() => handlePointerDown(codePoint, group.name)}
      onPointerMove={() => handlePointerMove(codePoint, group.name)}
      onPointerUp={handlePointerUp}
    >
      <span
        className={cx(
          `grow text-[0.7rem] 'system-ui'`,
          file?.name && 'font-[PreviewFont,AdobeBlack]'
        )}
      >
        {char}
      </span>
      <span className="text-[0.5rem]">
        {(char.charCodeAt(0) | 0).toString(16).padStart(4, '0')}
      </span>
    </button>
  )
}
