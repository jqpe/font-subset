export const numbersPattern = /\p{Number}/u
export const punctuationPattern = /\p{P}/u
export const marksPattern = /\p{M}/u
export const currencyPattern = /\p{Sc}/u
export const mathSymbolsPattern = /\p{Sm}/u
export const uppercaseLettersPattern = /\p{Lu}/u
export const lowercaseLettersPattern = /\p{Ll}/u
export const otherSymbolsPattern =
  /[^\p{Number}\p{P}\p{M}\p{Sc}\p{Sm}\p{Lu}\p{Ll}]/u

/* @see https://en.wikipedia.org/wiki/Unicode_character_property#Character_name_alias#General_Category */
export const groupDefinitions = [
  {
    name: 'Numbers',
    pattern: numbersPattern
  },
  {
    name: 'Punctuation',
    pattern: punctuationPattern
  },
  {
    name: 'Marks',
    pattern: marksPattern
  },
  {
    name: 'Currency',
    pattern: currencyPattern
  },
  {
    name: 'Math symbols',
    pattern: mathSymbolsPattern
  },
  {
    name: 'Uppercase Letters',
    pattern: uppercaseLettersPattern
  },
  {
    name: 'Lowercase Letters',
    pattern: lowercaseLettersPattern
  },
  {
    name: 'Other Symbols',
    pattern: otherSymbolsPattern
  }
]
