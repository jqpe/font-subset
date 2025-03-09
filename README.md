# font-subset

font-subset will create a subset of your font, including only the glyphs needed to render the characters you define.

## Limitations

These limitations may change in the future. Star github.com/jqpe/font-subset for updates!

- Only characters in the [Basic Multilingual Plane (BMP)](<https://en.wikipedia.org/wiki/Plane_(Unicode)#Overview>) are supported. This means subsetting emoji or icon fonts is often not possible.
- Only a single font can be processed at a time. If multiple files were dropped, the last will be used.
- All variable axes will be kept as in the original.
- The font is automatically converted to Woff2 format.
- Very large fonts might not work. Tested up to a 2.5MB font. A Woff2 font will need to be decompressed for subsetting, so its actual size might be up to 5x the Woff2 size.
- Modifier symbols currently do not get special treatment, entering ¨ + o to create ö will include both ¨ and ö in the subset input. You can click a character in the input preview grid to exclude it.

## Usage

1. Define the charactes you want to keep. You might find it beneficial to start with unicode blocks (see https://unicode.link/blocks for example) and then use the text input to add additional characters.
   1. Do not put U+ or anything else before the Unicode ranges (or a single Unicode codepoint)
   2. `0x00ff = 0xff == 255`
   3. Avoid entering large values (like `0-ffff`). It will work, but might take a while 😅.
   4. Syntax: `0-7f, fffd, 80-ff` will include Basic Latin, the Replacement character (�) and Latin-1 Supplement. You can also exclude characters or ranges by prefixing with `!`: `0-7f, !20-2f, !60` for Basic Latin without punctuation and grave accent.
   5. Control characters are excluded by default.
2. Drop a font.
3. You can now use the editor (supports basic markdown shortcuts like # for a heading) to inspect your font, play with the variations and most importantly, download the subset.
