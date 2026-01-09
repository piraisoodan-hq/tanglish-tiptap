/**
 * TipTap Transliteration Extension
 *
 * Provides real-time transliteration as you type, with:
 * - Automatic transliteration on Space/Enter
 * - Toggle support (enable/disable)
 * - Keyboard shortcuts
 * - Suggestion popup support
 *
 * @packageDocumentation
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import {
  TransliterationEngine,
  tamilConfig,
  type LanguageConfig,
  type TanglishSuggestion,
  type Suggestion,
} from '@piraisoodan/tanglish';

// Re-export types from core for convenience
export type { TanglishSuggestion, LanguageConfig, Suggestion } from '@piraisoodan/tanglish';

/**
 * Extension options
 */
export interface TransliterationOptions {
  /** Whether transliteration is enabled */
  enabled: boolean;
  /** Language configuration (defaults to Tamil) */
  language: LanguageConfig;
  /** Characters that trigger transliteration */
  triggerChars: string[];
  /** Callback when suggestions should be shown */
  onSuggestionsUpdate?: (
    suggestions: TanglishSuggestion[],
    position: { top: number; left: number } | null
  ) => void;
  /** Minimum characters before showing suggestions */
  minCharsForSuggestion: number;
  /** Maximum suggestions to show */
  maxSuggestions: number;
}

/**
 * Plugin key for accessing plugin state
 */
export const TransliterationPluginKey = new PluginKey('transliteration');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    transliteration: {
      /**
       * Enable or disable transliteration
       */
      setTransliteration: (enabled: boolean) => ReturnType;
      /**
       * Toggle transliteration on/off
       */
      toggleTransliteration: () => ReturnType;
      /**
       * Transliterate selected text
       */
      transliterateSelection: () => ReturnType;
    };
  }
}

/**
 * TipTap Transliteration Extension
 *
 * @example
 * ```typescript
 * import { Transliteration } from '@piraisoodan/tanglish-tiptap';
 *
 * const editor = new Editor({
 *   extensions: [
 *     StarterKit,
 *     Transliteration.configure({
 *       enabled: true,
 *       onSuggestionsUpdate: (suggestions, position) => {
 *         // Show your suggestion popup
 *       }
 *     })
 *   ]
 * });
 * ```
 */
export const Transliteration = Extension.create<TransliterationOptions>({
  name: 'transliteration',

  addOptions() {
    return {
      enabled: false,
      language: tamilConfig,
      triggerChars: [' ', 'Enter'],
      onSuggestionsUpdate: undefined,
      minCharsForSuggestion: 2,
      maxSuggestions: 8,
    };
  },

  addStorage() {
    return {
      engine: null as TransliterationEngine | null,
      enabled: false,
    };
  },

  onCreate() {
    this.storage.engine = new TransliterationEngine(this.options.language);
    this.storage.enabled = this.options.enabled;
  },

  addCommands() {
    return {
      setTransliteration:
        (enabled: boolean) =>
        ({ editor: _editor }) => {
          this.storage.enabled = enabled;
          // Clear suggestions when disabling
          if (!enabled && this.options.onSuggestionsUpdate) {
            this.options.onSuggestionsUpdate([], null);
          }
          return true;
        },

      toggleTransliteration:
        () =>
        ({ commands }) => {
          return commands.setTransliteration(!this.storage.enabled);
        },

      transliterateSelection:
        () =>
        ({ editor: _editor, state, dispatch }) => {
          if (!this.storage.engine) return false;

          const { from, to } = state.selection;
          if (from === to) return false;

          const selectedText = state.doc.textBetween(from, to);
          const transliterated = this.storage.engine.transliterate(selectedText);

          if (transliterated === selectedText) return false;

          if (dispatch) {
            const tr = state.tr.replaceWith(from, to, state.schema.text(transliterated));
            dispatch(tr);
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-t': () => this.editor.commands.toggleTransliteration(),
    };
  },

  addProseMirrorPlugins() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const extension = this;

    return [
      new Plugin({
        key: TransliterationPluginKey,

        props: {
          handleTextInput(view, from, to, text) {
            // Skip if not enabled
            if (!extension.storage.enabled || !extension.storage.engine) {
              return false;
            }

            const isTrigger = extension.options.triggerChars.includes(text);

            if (isTrigger) {
              // Find the word before cursor
              const resolvedPos = view.state.doc.resolve(from);
              const textBefore = resolvedPos.parent.textBetween(
                0,
                resolvedPos.parentOffset,
                undefined,
                '\ufffc'
              );

              // Extract last word
              const wordMatch = textBefore.match(/(\S+)$/);
              if (!wordMatch) return false;

              const word = wordMatch[1];
              const wordStart = from - word.length;

              // Skip if already contains Tamil
              if (extension.storage.engine.containsTargetScript(word)) {
                return false;
              }

              // Transliterate
              const transliterated = extension.storage.engine.transliterate(word);
              if (transliterated === word) return false;

              // Replace word with transliteration + trigger char
              const tr = view.state.tr
                .delete(wordStart, from)
                .insertText(transliterated + text, wordStart);

              view.dispatch(tr);

              // Clear suggestions
              if (extension.options.onSuggestionsUpdate) {
                extension.options.onSuggestionsUpdate([], null);
              }

              return true;
            }

            return false;
          },

          handleKeyDown(view, event) {
            // Handle Enter key - but SKIP if suggestions are active (let the UI handle selection)
            if (event.key === 'Enter' && extension.storage.enabled && extension.storage.engine) {
              // Check if there are active suggestions - if so, skip transliteration
              // The UI will handle the selection via onSuggestionsUpdate
              const { state } = view;
              const { from } = state.selection;
              const resolvedPos = state.doc.resolve(from);
              const textBefore = resolvedPos.parent.textBetween(
                0,
                resolvedPos.parentOffset,
                undefined,
                '\ufffc'
              );

              const wordMatch = textBefore.match(/(\S+)$/);
              if (wordMatch) {
                const word = wordMatch[1];
                
                // Check if this word would generate suggestions (meaning popup is likely showing)
                const suggestions = extension.storage.engine.getSuggestions(word, 1);
                if (suggestions.length > 0 && word.length >= extension.options.minCharsForSuggestion) {
                  // Suggestions are active - DON'T transliterate, let UI handle Enter
                  return false;
                }

                if (!extension.storage.engine.containsTargetScript(word)) {
                  const transliterated = extension.storage.engine.transliterate(word);

                  if (transliterated !== word) {
                    const wordStart = from - word.length;
                    const tr = state.tr
                      .delete(wordStart, from)
                      .insertText(transliterated, wordStart);
                    view.dispatch(tr);

                    // Clear suggestions
                    if (extension.options.onSuggestionsUpdate) {
                      extension.options.onSuggestionsUpdate([], null);
                    }

                    // Don't prevent default - let Enter create new line
                  }
                }
              }
            }

            return false;
          },
        },

        view() {
          return {
            update(view) {
              // Update suggestions on every change
              if (
                !extension.storage.enabled ||
                !extension.storage.engine ||
                !extension.options.onSuggestionsUpdate
              ) {
                return;
              }

              const { state } = view;
              const { from } = state.selection;
              const resolvedPos = state.doc.resolve(from);
              const textBefore = resolvedPos.parent.textBetween(
                0,
                resolvedPos.parentOffset,
                undefined,
                '\ufffc'
              );

              // Extract last word
              const wordMatch = textBefore.match(/(\S+)$/);
              if (!wordMatch || wordMatch[1].length < extension.options.minCharsForSuggestion) {
                extension.options.onSuggestionsUpdate([], null);
                return;
              }

              const word = wordMatch[1];

              // Skip if contains target script
              if (extension.storage.engine.containsTargetScript(word)) {
                extension.options.onSuggestionsUpdate([], null);
                return;
              }

              // Get suggestions and map to TanglishSuggestion format
              const rawSuggestions = extension.storage.engine.getSuggestions(
                word,
                extension.options.maxSuggestions
              );

              const suggestions: TanglishSuggestion[] = rawSuggestions.map((s: Suggestion) => ({
                ...s,
                tanglish: s.input,
                tamil: s.output,
              }));

              if (suggestions.length === 0) {
                extension.options.onSuggestionsUpdate([], null);
                return;
              }

              // Calculate position
              const coords = view.coordsAtPos(from);
              extension.options.onSuggestionsUpdate(suggestions, {
                top: coords.bottom + 4,
                left: coords.left,
              });
            },
          };
        },
      }),
    ];
  },
});

/**
 * Create a standalone suggestion handler
 * Useful for custom implementations outside TipTap
 */
export function createSuggestionHandler(config?: LanguageConfig) {
  const engine = new TransliterationEngine(config || tamilConfig);

  return {
    engine,
    getSuggestions: (query: string, limit = 10): TanglishSuggestion[] => {
      const rawSuggestions = engine.getSuggestions(query, limit);
      return rawSuggestions.map((s: Suggestion) => ({
        ...s,
        tanglish: s.input,
        tamil: s.output,
      }));
    },
    transliterate: (text: string) => engine.transliterate(text),
    containsTargetScript: (text: string) => engine.containsTargetScript(text),
  };
}

// Default export
export default Transliteration;
