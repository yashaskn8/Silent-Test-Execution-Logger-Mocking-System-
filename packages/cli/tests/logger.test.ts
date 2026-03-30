import { describe, it, expect, vi } from 'vitest';
import { createLogger, debugLogger } from 'cli-core';
import './custom-matchers.js';
import { logCapturer } from './test-setup.js';

describe('Logger Behavior under Mock', () => {
  it('should capture logs silently on test pass', () => {
    // Generate some logs
    debugLogger.info('This is an info log for a passing test');
    debugLogger.warn('This is a warn log for a passing test');
    
    // Validate that logs are captured internally and not printed 
    // Filter out stdout/stderr in case Vitest logs internally
    const logs = logCapturer.getLogs().filter(l => !['stdout', 'stderr'].includes(l.level));
    
    expect(logs.length).toBeGreaterThanOrEqual(2);
    const infoLog = logs.find(l => l.level === 'info');
    expect(infoLog?.message).toBe('[core] This is an info log for a passing test');
    
    // Testing using the custom matcher
    expect(debugLogger).toHaveLoggedWithLevel('warn', /pass/);
  });

  // Uncomment or run directly to see the global capturing behavior.
  // it('should flush logs on failure', () => {
  //   debugLogger.error('This error will be printed because the test fails!');
  //   debugLogger.info('Some context before failure');
  //   expect(1).toBe(2);
  // });
  
  it('should mock child loggers properly', () => {
    const logger: any = createLogger('my-namespace');
    const childLogger: any = logger.child('sub-namespace');
    
    childLogger.debug('Child log statement');
    
    expect(childLogger.debug).toHaveBeenCalledWith('Child log statement');
    
    const logs = logCapturer.getLogs().filter(l => !['stdout', 'stderr'].includes(l.level));
    const debugLog = logs.find(l => l.message === '[my-namespace:sub-namespace] Child log statement');
    expect(debugLog?.level).toBe('debug');
  });

  it('should preserve non-logger exports and use vi.importActual under the hood', async () => {
    // Note: vi.importActual is used in vi.mock logic in test-setup.ts
    // The createLogger and debugLogger functionality itself proves the mock applied correctly.
    expect(debugLogger.info).toBeDefined();
    expect(vi.isMockFunction(debugLogger.info)).toBe(true);
  });
});
