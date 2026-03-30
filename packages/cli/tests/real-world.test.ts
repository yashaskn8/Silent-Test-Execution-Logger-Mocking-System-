import { describe, it, expect } from 'vitest';
import { createLogger, debugLogger } from 'cli-core';
import './custom-matchers.js';
import { logCapturer } from './test-setup.js';

describe('Real World Scenario: API Client', () => {
  const apiClientLogger = createLogger('APIClient');

  it('should successfully fetch data without printing logs', () => {
    apiClientLogger.info('Initiating generic request', { url: '/api/v1/health' });
    apiClientLogger.debug('Resolving DNS for connection...');
    apiClientLogger.info('Connection established via HTTP/2');
    
    // Simulate successful fetch
    const response = { status: 200, data: { ok: true } };
    
    apiClientLogger.info('Response received', { statusCode: response.status });
    
    expect(response.status).toBe(200);
    expect(apiClientLogger).toHaveLoggedWithLevel('info', /Response received/);
    expect(apiClientLogger).toHaveLoggedData({ statusCode: 200 });
  });

  // Failing test intentionally left un-skipped to demonstrate output
  it('should demonstrate failing request and flush beautiful formatted diagnostic logs', () => {
    const serviceLogger = apiClientLogger.child('UserService');

    serviceLogger.info('Attempting to fetch user profile', { userId: '1337-xyz' });
    serviceLogger.debug('Building request headers', { 
      headers: {
        Authorization: 'Bearer ********',
        'X-Client-Id': 'web-v2',
        Accept: 'application/json'
      }
    });

    // Simulate warning/retries
    serviceLogger.warn('Connection timeout after 5000ms. Retrying (1/3)...');
    serviceLogger.warn('Connection timeout after 5000ms. Retrying (2/3)...');
    serviceLogger.warn('Connection timeout after 5000ms. Retrying (3/3)...');

    // Simulate final failure
    const errorDetails = {
      code: 'ECONNRESET',
      syscall: 'read',
      host: 'api.example.internal',
      port: 443,
      context: {
        userId: '1337-xyz',
        datacenter: 'us-east-1'
      }
    };

    serviceLogger.error('Failed to fetch user profile after 3 retries', errorDetails);

    // This will intentionally fail the test and flush everything above visually nicely.
    expect(true).toBe(false);
  });
});
