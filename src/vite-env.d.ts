/// <reference types="vite/client" />

import type { FontPreviewAttributes } from './font-preview'

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      'font-preview': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & FontPreviewAttributes,
        HTMLElement
      >
    }
  }
}

export {}
