import { vi, afterEach, beforeEach } from 'vitest';
import type { LogLevel } from 'cli-core';
import util from 'node:util';
import path from 'node:path';

interface CapturedLog {
  level: LogLevel | 'stdout' | 'stderr';
  message: string;
  data?: any;
  timestamp: string;
  deltaMs: number;
  caller?: string;
}

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
};

const SYMBOLS = {
  info: 'ℹ',
  warn: '⚠',
  error: '✖',
  debug: '⚙',
  stdout: '❯',
  stderr: '❯'
};

class LogCapturer {
  private logs: CapturedLog[] = [];
  private lastLogTime: number = Date.now();
  private console: Console | typeof console;

  constructor(originalConsole?: typeof console) {
    this.console = originalConsole || console;
  }

  record(level: CapturedLog['level'], message: string, data?: any, includeCaller = true) {
    const now = Date.now();
    const deltaMs = this.logs.length === 0 ? 0 : now - this.lastLogTime;
    this.lastLogTime = now;

    let caller: string | undefined = undefined;

    // Advanced: Extract caller file and line number from stack trace
    if (includeCaller) {
      const stack = new Error().stack;
      if (stack) {
        // Skip lines for Error, LogCapturer, and mock wrappers to find the actual source
        const lines = stack.split('\n');
        const callerLine = lines.find(line => 
          line.includes('at ') && 
          !line.includes('test-setup.ts') && 
          !line.includes('LogCapturer.record') &&
          !line.includes('node:internal')
        );
        
        if (callerLine) {
          // Extract file:line:col
          const match = callerLine.match(/\((.*):(\d+):(\d+)\)/) || callerLine.match(/at (.*):(\d+):(\d+)/);
          if (match) {
            const [, filePath, line, col] = match;
            const file = path.basename(filePath);
            caller = `${file}:${line}:${col}`;
          }
        }
      }
    }

    this.logs.push({ 
      level, 
      message, 
      data,
      timestamp: new Date().toISOString(),
      deltaMs,
      caller
    });
  }

  flush(testName: string) {
    if (this.logs.length === 0) return;
    
    this.console.log(`\n${COLORS.bgRed}${COLORS.bold} FAIL ${COLORS.reset} ${COLORS.red}⎯⎯⎯⎯⎯ Captured Execution Trace ⎯⎯⎯⎯⎯${COLORS.reset}`);
    this.console.log(`${COLORS.bold}Test:${COLORS.reset} ${COLORS.green}${testName}${COLORS.reset}\n`);

    this.logs.forEach(log => {
      let levelColor = COLORS.reset;
      let symbol = '';

      switch(log.level) {
        case 'error': case 'stderr': levelColor = COLORS.red; symbol = SYMBOLS.error; break;
        case 'warn': levelColor = COLORS.yellow; symbol = SYMBOLS.warn; break;
        case 'info': levelColor = COLORS.blue; symbol = SYMBOLS.info; break;
        case 'debug': levelColor = COLORS.gray; symbol = SYMBOLS.debug; break;
        case 'stdout': levelColor = COLORS.reset; symbol = SYMBOLS.stdout; break;
      }

      const time = `${COLORS.dim}[${log.timestamp.split('T')[1].replace('Z','')}]${COLORS.reset}`;
      const delta = log.deltaMs > 0 ? `${COLORS.yellow}+${log.deltaMs}ms${COLORS.reset}` : `${COLORS.dim}+0ms${COLORS.reset}`;
      const levelBadge = `${levelColor}${COLORS.bold}${symbol} ${log.level.toUpperCase().padEnd(6)}${COLORS.reset}`;
      const callerBadge = log.caller ? `${COLORS.dim}${COLORS.italic}(${log.caller})${COLORS.reset}` : '';

      let out = `${time} ${levelBadge} ${log.message} ${delta} ${callerBadge}`;
      
      if (log.data) {
        const formattedData = util.inspect(log.data, {
          colors: true,
          depth: 4,
          compact: false
        });
        out += `\n${formattedData.split('\n').map(line => `    ${line}`).join('\n')}`;
      }
      
      this.console.log(out);
    });
    
    this.console.log(`${COLORS.bold}${COLORS.red}⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯${COLORS.reset}\n`);
    this.clear();
  }

  clear() {
    this.logs = [];
    this.lastLogTime = Date.now();
  }
  
  getLogs() {
    return this.logs;
  }
}

const originalConsole = { ...console };
export const logCapturer = new LogCapturer(originalConsole);

const ENABLE_TEST_LOGS = process.env.ENABLE_TEST_LOGS === 'true';

if (!ENABLE_TEST_LOGS) {
  vi.mock('cli-core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('cli-core')>();
    
    const createMockLogger = (namespace?: string): any => {
      const formatMsg = (msg: string) => namespace ? `[${namespace}] ${msg}` : msg;

      return {
        info: vi.fn((msg, data) => logCapturer.record('info', formatMsg(msg), data)),
        warn: vi.fn((msg, data) => logCapturer.record('warn', formatMsg(msg), data)),
        error: vi.fn((msg, data) => logCapturer.record('error', formatMsg(msg), data)),
        debug: vi.fn((msg, data) => logCapturer.record('debug', formatMsg(msg), data)),
        child: vi.fn((ns: string) => createMockLogger(namespace ? `${namespace}:${ns}` : ns))
      };
    };

    return {
      ...actual,
      createLogger: vi.fn((namespace?: string) => createMockLogger(namespace)),
      debugLogger: createMockLogger('core')
    };
  });

  // 2. Intercept rogue global console calls (third-party libs, forgotten console.logs)
  console.log = (...args: any[]) => logCapturer.record('stdout', util.format(...args), undefined, true);
  console.info = (...args: any[]) => logCapturer.record('info', util.format(...args), undefined, true);
  console.warn = (...args: any[]) => logCapturer.record('warn', util.format(...args), undefined, true);
  console.error = (...args: any[]) => logCapturer.record('stderr', util.format(...args), undefined, true);
  console.debug = (...args: any[]) => logCapturer.record('debug', util.format(...args), undefined, true);
}

beforeEach(() => {
  logCapturer.clear();
  vi.clearAllMocks();
});

afterEach(({ task }) => {
  if (task.result?.state === 'fail' && !ENABLE_TEST_LOGS) {
    let current: any = task;
    const path = [];
    while (current) {
      if (current.name) path.unshift(current.name);
      current = current.suite;
    }
    logCapturer.flush(path.join(' > '));
  }
});
