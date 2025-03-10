import { toTextFromUnicode } from '../../utils'
import { groupDefinitions, otherSymbolsPattern } from './groups'

export interface CharacterGroup {
  name: string
  chars: string[]
  pattern: RegExp
}

export function groupCharacters(unicode: string): CharacterGroup[] {
  const groupedChars = toTextFromUnicode(unicode)
    .split('')
    .reduce((acc, char) => {
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

  // Sort characters within each group
  groupedChars.forEach(group => {
    group.chars.sort((a, b) => (a.codePointAt(0) || 0) - (b.codePointAt(0) || 0))
  })

  return groupedChars
}

export function filterSupportedChars(
  groups: CharacterGroup[],
  showOnlySupported: boolean,
  isCodepointSupported: (codepoint: number) => boolean
): CharacterGroup[] {
  return groups.filter(group => {
    const visibleChars = group.chars.filter(
      char => !showOnlySupported || isCodepointSupported(char.codePointAt(0) || 0)
    )
    return visibleChars.length > 0
  })
}
