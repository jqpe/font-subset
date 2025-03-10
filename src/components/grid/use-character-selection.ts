import { useState, useEffect } from 'react'

interface SelectionRange {
  start: number | null
  end: number | null
}

export function useCharacterSelection() {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRange, setSelectionRange] = useState<SelectionRange>({
    start: null,
    end: null
  })
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [swipeModifierActive, setSwipeModifierActive] = useState(false)
  const [additionalSelections, setAdditionalSelections] = useState<number[]>([])

  // Handle global events for selection
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isSelecting) {
        setIsSelecting(false)
        setSelectionRange({ start: null, end: null })
        setAdditionalSelections([])
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setSwipeModifierActive(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setSwipeModifierActive(false)
      }
    }

    window.addEventListener('pointerup', handleGlobalPointerUp)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isSelecting])

  // Handle case matching selections
  useEffect(() => {
    if (
      isSelecting &&
      swipeModifierActive &&
      selectionRange.start !== null &&
      selectionRange.end !== null
    ) {
      const start = Math.min(selectionRange.start, selectionRange.end)
      const end = Math.max(selectionRange.start, selectionRange.end)

      const additionalCPs: number[] = []

      for (let cp = start; cp <= end; cp++) {
        const char = String.fromCodePoint(cp)
        const upperChar = char.toUpperCase()
        const lowerChar = char.toLowerCase()

        if (upperChar !== lowerChar) {
          if (char === upperChar) {
            additionalCPs.push(lowerChar.codePointAt(0)!)
          } else {
            additionalCPs.push(upperChar.codePointAt(0)!)
          }
        }
      }

      setAdditionalSelections(additionalCPs)
    } else {
      setAdditionalSelections([])
    }
  }, [isSelecting, swipeModifierActive, selectionRange.start, selectionRange.end])

  return {
    isSelecting,
    setIsSelecting,
    selectionRange,
    setSelectionRange,
    activeGroup,
    setActiveGroup,
    swipeModifierActive,
    additionalSelections
  }
}
