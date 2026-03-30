import { expect } from 'vitest';
import { logCapturer } from './test-setup.js';
import type { LogLevel } from 'cli-core';

expect.extend({
  toHaveLoggedWithLevel(received: any, level: LogLevel, messageRegex?: RegExp) {
    const logs = logCapturer.getLogs();
    const matchesLevel = logs.filter(l => l.level === level);
    
    let pass = matchesLevel.length > 0;
    
    if (pass && messageRegex) {
      pass = matchesLevel.some(l => messageRegex.test(l.message));
    }

    return {
      pass,
      message: () => `expected logger to${this.isNot ? ' not ' : ' '}have logged level "${level}"${messageRegex ? ` matching ${messageRegex}` : ''}. \nFound logs:\n${logs.map(l => `[${l.level}] ${l.message}`).join('\n')}`
    };
  },
  
  toHaveLoggedData(received: any, dataSubset: Record<string, any>) {
    const logs = logCapturer.getLogs();
    
    const pass = logs.some(l => {
      if (!l.data) return false;
      // Shallow subset check
      return Object.entries(dataSubset).every(([key, value]) => l.data[key] === value);
    });

    return {
      pass,
      message: () => `expected logger to${this.isNot ? ' not ' : ' '}have logged data containing ${JSON.stringify(dataSubset)}. \nFound data payloads:\n${logs.map(l => JSON.stringify(l.data)).join('\n')}`
    };
  }
});
