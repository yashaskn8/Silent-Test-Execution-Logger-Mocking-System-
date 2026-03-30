# Silent-Test-Execution-Logger-Mocking-System-
A production-grade testing infrastructure that eliminates noisy logs using global logger mocking in Vitest, showing logs only for failed tests while keeping successful test runs clean and readable.
The Silent Test Execution System is a production-grade testing infrastructure that eliminates noisy logs during test runs by globally mocking loggers.

It ensures:

✅ Clean output for passing tests
✅ Automatic log visibility for failing tests
✅ Improved debugging without clutter
Architecture Overview

The system uses centralized mocking and intelligent log capture:

Test Run
   │
   ▼
Global Logger Mock (vi.mock)
   │
   ▼
Log Capturer (Singleton)
   │
   ├── PASS → Logs Hidden
   │
   ▼
   FAIL → Flush Logs to Console
Modules
Module	Purpose
Logger (Core)	Provides debugLogger and createLogger with structured logging
Global Mock	Overrides logger using vi.mock()
Log Capturer	Records logs and conditionally flushes on failure
Test Setup	Initializes mocking and lifecycle hooks
CLI / Tests	Demonstrates usage and validates behavior
Project Structure
packages/
├── cli-core/
│   └── src/
│       ├── logger/
│       │   ├── types.ts
│       │   └── debug-logger.ts
│       └── config/
│           └── config-manager.ts
│
└── cli/
    ├── test-setup.ts          # Global mock setup
    ├── vitest.config.ts       # Vitest configuration
    └── src/
        ├── logger.test.ts
        ├── config-integration.test.ts
        ├── mock-override.test.ts
        └── commands/
Configuration
Vitest Setup
export default defineConfig({
  test: {
    silent: true,
    setupFiles: ['test-setup.ts'],
    clearMocks: true
  }
});
Key Features
Global logger mocking using vi.mock()
Intelligent log capture with failure-based flushing
Zero console noise for passing tests
Context-aware debugging output for failed tests
Preserves original module exports via vi.importActual()
Supports child logger hierarchies
How It Works
Logger functions are replaced with silent mock implementations
Logs are captured in a centralized LogCapturer
After each test:
✅ If PASS → logs discarded
❌ If FAIL → logs flushed to console
Running Tests
# Run tests (silent mode)
npm test

# Run with CI reporter
npm run test:ci

# Run with full logs
npm run test:loud
Output Behavior

Passing Tests:

✔ test name
✔ summary only

Failing Tests:

✖ test name
→ Relevant logs printed
→ Error details shown
Advanced Features
Custom matchers:
expect(logger).toHaveLoggedWithLevel('error', /timeout/)
Environment override:
ENABLE_TEST_LOGS=true
License

MIT

Disclaimer

This project is an independent implementation and is not affiliated with any external organizations.
