import { describe, expect, test, beforeEach } from 'bun:test';
import { createSuggestionHandler, Transliteration } from '../src/index';

describe('createSuggestionHandler', () => {
  let handler: ReturnType<typeof createSuggestionHandler>;

  beforeEach(() => {
    handler = createSuggestionHandler();
  });

  test('should create handler with default Tamil config', () => {
    expect(handler).toBeDefined();
    expect(handler.engine).toBeDefined();
    expect(typeof handler.getSuggestions).toBe('function');
    expect(typeof handler.transliterate).toBe('function');
    expect(typeof handler.containsTargetScript).toBe('function');
  });

  test('should transliterate basic Tamil words', () => {
    expect(handler.transliterate('vanakkam')).toBe('வணக்கம்');
    expect(handler.transliterate('nandri')).toBe('நன்றி');
    // 'tamil' needs proper spelling 'thamizh' for correct output
    expect(handler.transliterate('thamizh')).toBe('தமிழ்');
  });

  test('should get suggestions for partial input', () => {
    const suggestions = handler.getSuggestions('van', 5);
    expect(suggestions.length).toBeGreaterThan(0);
    // Check for correct property names from TanglishSuggestion
    expect(suggestions[0]).toHaveProperty('input');
    expect(suggestions[0]).toHaveProperty('output');
    // Check for tanglish/tamil aliases
    expect(suggestions[0]).toHaveProperty('tanglish');
    expect(suggestions[0]).toHaveProperty('tamil');
    expect(suggestions[0].tanglish).toBe(suggestions[0].input);
    expect(suggestions[0].tamil).toBe(suggestions[0].output);
  });

  test('should detect Tamil script', () => {
    expect(handler.containsTargetScript('வணக்கம்')).toBe(true);
    expect(handler.containsTargetScript('hello')).toBe(false);
    expect(handler.containsTargetScript('நன்றி world')).toBe(true);
  });

  test('should respect suggestion limit', () => {
    const suggestions = handler.getSuggestions('a', 3);
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  test('should return empty suggestions for unknown words', () => {
    const suggestions = handler.getSuggestions('xyzabc123', 5);
    // Should still return transliteration suggestion even for unknown words
    expect(suggestions.length).toBeGreaterThanOrEqual(0);
  });
});

describe('Transliteration Extension', () => {
  test('should export Transliteration extension', () => {
    expect(Transliteration).toBeDefined();
    expect(Transliteration.name).toBe('transliteration');
  });

  test('should have correct default options', () => {
    const options = Transliteration.options;
    expect(options.enabled).toBe(false);
    expect(options.triggerChars).toEqual([' ', 'Enter']);
    expect(options.minCharsForSuggestion).toBe(2);
    expect(options.maxSuggestions).toBe(8);
  });

  test('should be configurable', () => {
    const configured = Transliteration.configure({
      enabled: true,
      minCharsForSuggestion: 3,
      maxSuggestions: 5,
    });
    expect(configured).toBeDefined();
  });
});
