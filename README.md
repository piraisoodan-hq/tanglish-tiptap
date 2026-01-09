# @piraisoodan/tanglish-tiptap

TipTap extension for real-time transliteration using [@piraisoodan/tanglish](https://github.com/desingh-rajan/tanglish).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ⌨️ **Real-time Transliteration**: Automatically converts romanized text on Space/Enter
- 💡 **Suggestion Popup**: Shows matching Tamil words as you type
- 🔄 **Toggle Support**: Enable/disable transliteration on the fly
- ⚡ **Keyboard Shortcuts**: `Ctrl+Shift+T` to toggle
- 🎯 **Selection Transliteration**: Convert selected text to Tamil
- 🔌 **Framework Agnostic**: Works with any UI framework (React, Vue, Svelte, etc.)

## Installation

```bash
# npm
npm install @piraisoodan/tanglish @piraisoodan/tanglish-tiptap

# bun
bun add @piraisoodan/tanglish @piraisoodan/tanglish-tiptap

# yarn
yarn add @piraisoodan/tanglish @piraisoodan/tanglish-tiptap
```

## Quick Start

```typescript
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Transliteration } from '@piraisoodan/tanglish-tiptap';

const editor = new Editor({
  element: document.querySelector('#editor'),
  extensions: [
    StarterKit,
    Transliteration.configure({
      enabled: true
    })
  ]
});
```

## Usage with Suggestions Popup

```typescript
import { Transliteration, type TanglishSuggestion } from '@piraisoodan/tanglish-tiptap';

// Track suggestions state in your UI framework
let suggestions: TanglishSuggestion[] = [];
let popupPosition: { top: number; left: number } | null = null;

const editor = new Editor({
  extensions: [
    StarterKit,
    Transliteration.configure({
      enabled: true,
      minCharsForSuggestion: 2,
      maxSuggestions: 8,
      onSuggestionsUpdate: (newSuggestions, position) => {
        suggestions = newSuggestions;
        popupPosition = position;
        // Update your popup UI here
      }
    })
  ]
});
```

## React Example

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Transliteration, type TanglishSuggestion } from '@piraisoodan/tanglish-tiptap';
import { useState } from 'react';

function TamilEditor() {
  const [suggestions, setSuggestions] = useState<TanglishSuggestion[]>([]);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Transliteration.configure({
        enabled: true,
        onSuggestionsUpdate: (s, p) => {
          setSuggestions(s);
          setPosition(p);
        }
      })
    ]
  });

  return (
    <div>
      <EditorContent editor={editor} />
      {suggestions.length > 0 && position && (
        <div style={{ position: 'fixed', top: position.top, left: position.left }}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => selectSuggestion(s)}>
              {s.tanglish} → {s.tamil}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Commands

```typescript
// Toggle transliteration on/off
editor.commands.toggleTransliteration();

// Enable/disable directly
editor.commands.setTransliteration(true);
editor.commands.setTransliteration(false);

// Transliterate selected text
editor.commands.transliterateSelection();
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` / `Cmd+Shift+T` | Toggle transliteration |

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Initial enabled state |
| `language` | `LanguageConfig` | Tamil | Language configuration |
| `triggerChars` | `string[]` | `[' ', 'Enter']` | Characters that trigger transliteration |
| `onSuggestionsUpdate` | `function` | `undefined` | Callback for suggestion updates |
| `minCharsForSuggestion` | `number` | `2` | Min chars before showing suggestions |
| `maxSuggestions` | `number` | `8` | Max suggestions to show |

## Standalone Helper

Use transliteration outside of TipTap:

```typescript
import { createSuggestionHandler } from '@piraisoodan/tanglish-tiptap';

const handler = createSuggestionHandler();

// Get suggestions
const suggestions = handler.getSuggestions('van', 5);
// [{ tanglish: 'vanakkam', tamil: 'வணக்கம்' }, ...]

// Transliterate
const tamil = handler.transliterate('nandri');
// நன்றி

// Check for Tamil text
handler.containsTargetScript('வணக்கம்'); // true
```

## Peer Dependencies

This package requires:

- `@tiptap/core` ^2.0.0 || ^3.0.0
- `@tiptap/pm` ^2.0.0 || ^3.0.0
- `@piraisoodan/tanglish` >=0.1.0

## Development

```bash
# Clone
git clone https://github.com/desingh-rajan/tanglish-tiptap.git
cd tanglish-tiptap

# Install dependencies
bun install

# Build
bun run build
```

## License

MIT © [Piraisoodan Team](https://github.com/desingh-rajan)

## Related Projects

- [@piraisoodan/tanglish](https://github.com/desingh-rajan/tanglish) - Core transliteration engine
- [piraisoodan](https://github.com/desingh-rajan/piraisoodan) - Tamil writing app
