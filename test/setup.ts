import { GlobalWindow } from 'happy-dom';

const win = new GlobalWindow();
global.window = win as any;
global.document = win.document as any;
global.navigator = win.navigator as any;
global.console = win.console;

// Polyfill minimal Selection API for Tiptap
if (!window.document.getSelection) {
  (window.document as any).getSelection = () => ({
    rangeCount: 0,
    addRange: () => {},
    getRangeAt: () => ({}),
    removeAllRanges: () => {},
  });
}

// Polyfill requestAnimationFrame
if (!global.requestAnimationFrame) {
  (global as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 0);
  };
}

if (!global.cancelAnimationFrame) {
  (global as any).cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

// Polyfill getComputedStyle for ProseMirror - attach to global and window
const getComputedStylePolyfill = (_element: Element) => {
  return {
    getPropertyValue: (_prop: string) => {
      return '';
    },
    position: 'static',
  };
};

if (!global.getComputedStyle) {
  (global as any).getComputedStyle = getComputedStylePolyfill;
}

if (global.window && !global.window.getComputedStyle) {
  (global.window as any).getComputedStyle = getComputedStylePolyfill;
}
