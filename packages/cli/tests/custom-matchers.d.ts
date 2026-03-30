import 'vitest';

interface CustomMatchers<R = unknown> {
  toHaveLoggedWithLevel(level: string, messageRegex?: RegExp): R;
  toHaveLoggedData(dataSubset: Record<string, any>): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
