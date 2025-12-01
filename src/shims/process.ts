// Shim for Node.js process object in browser environment
// Required by @story-protocol/core-sdk

export const process = {
  cwd: () => '/',
  env: {},
  platform: 'browser',
  version: 'v16.0.0',
  nextTick: (callback: Function) => {
    Promise.resolve().then(() => callback());
  },
};

// Attach to window
if (typeof window !== 'undefined') {
  (window as any).process = process;
}

// Attach to globalThis
if (typeof globalThis !== 'undefined') {
  (globalThis as any).process = process;
}

export default process;

// Also add to main.tsx at the very top:
// import './shims/process';