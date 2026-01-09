/**
 * @piraisoodan/tanglish-tiptap
 *
 * TipTap extension for real-time transliteration
 *
 * @example
 * ```typescript
 * import { Transliteration } from '@piraisoodan/tanglish-tiptap';
 * import { Editor } from '@tiptap/core';
 * import StarterKit from '@tiptap/starter-kit';
 *
 * const editor = new Editor({
 *   extensions: [
 *     StarterKit,
 *     Transliteration.configure({
 *       enabled: true,
 *       onSuggestionsUpdate: (suggestions, position) => {
 *         // Update your suggestion popup UI
 *         if (suggestions.length > 0 && position) {
 *           showPopup(suggestions, position);
 *         } else {
 *           hidePopup();
 *         }
 *       }
 *     })
 *   ]
 * });
 *
 * // Toggle transliteration
 * editor.commands.toggleTransliteration();
 *
 * // Or set directly
 * editor.commands.setTransliteration(true);
 * ```
 */

export {
  Transliteration,
  TransliterationPluginKey,
  createSuggestionHandler,
  type TransliterationOptions,
} from './extension';

// Re-export types from core
export type { TanglishSuggestion, Suggestion, LanguageConfig } from '@piraisoodan/tanglish';

// Default export
export { Transliteration as default } from './extension';
