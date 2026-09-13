// Vitest test setup file
import '@testing-library/jest-dom';

// Ensure crypto and crypto.subtle are available in Node / jsdom environment
if (typeof globalThis.crypto === 'undefined') {
  // @ts-ignore
  const { webcrypto } = await import('node:crypto');
  // @ts-ignore
  globalThis.crypto = webcrypto;
}
