import { describe, expect, test, beforeEach, mock } from 'bun:test';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Transliteration } from '../src/index';

// Mock DOM environment for Tiptap
describe('Transliteration Editor Integration', () => {
  let editor: Editor;
  let suggestionsUpdateMock: any;

  beforeEach(() => {
    suggestionsUpdateMock = mock((suggestions: any, position: any) => {
      // Mock callback
    });

    // Create a new editor instance for each test
    // Note: We use a real element to attach to, although headlessly
    const element = document.createElement('div');
    document.body.appendChild(element);

    editor = new Editor({
      element,
      extensions: [
        StarterKit,
        Transliteration.configure({
          enabled: false, // Start disabled to test toggling
          onSuggestionsUpdate: suggestionsUpdateMock,
          minCharsForSuggestion: 2,
        }),
      ],
    });
  });

  // Cleanup after tests
  test('cleanup', () => {
    editor.destroy();
    document.body.innerHTML = '';
  });

  test('should initialize with Transliteration extension', () => {
    expect(
      editor.extensionManager.extensions.find((e) => e.name === 'transliteration')
    ).toBeDefined();
    expect((editor.storage as any).transliteration).toBeDefined();
    expect((editor.storage as any).transliteration.enabled).toBe(false);
  });

  test('should enable/disable via commands', () => {
    editor.commands.setTransliteration(true);
    expect((editor.storage as any).transliteration.enabled).toBe(true);

    editor.commands.setTransliteration(false);
    expect((editor.storage as any).transliteration.enabled).toBe(false);

    editor.commands.toggleTransliteration();
    expect((editor.storage as any).transliteration.enabled).toBe(true);
  });

  test('should NOT suggestion/transliterate when disabled', () => {
    editor.commands.setTransliteration(false);
    editor.chain().focus().insertContent('vanakkam').run();

    // Trigger update explicitly if needed, but typing should trigger it
    // In headless, we simulate interaction

    // reset mock
    suggestionsUpdateMock.mockClear();

    // Simulate typing " "
    editor.commands.insertContent(' ');

    // Content should be "vanakkam " (no change)
    expect(editor.getText()).toBe('vanakkam ');

    // Should not have called suggestions
    expect(suggestionsUpdateMock).not.toHaveBeenCalled();
  });
});
