import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'

export const UnicodeInput = Extension.create({
  name: 'unicodeInput',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('unicodeInput'),
        props: {
          handleKeyDown: view => {
            const { state } = view
            const { selection } = state
            const { $from } = selection

            const before = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 8),
              $from.parentOffset,
              ''
            )

            const match = /\\([0-9a-f]{4,})$/.exec(before)

            if (match) {
              const codePoint = parseInt(match[1], 16)
              const char = String.fromCodePoint(codePoint)

              const tr = state.tr
                .delete($from.pos - match[0].length, $from.pos)
                .insertText(char)

              view.dispatch(tr)
              return true
            }
            return false
          }
        }
      })
    ]
  }
})
