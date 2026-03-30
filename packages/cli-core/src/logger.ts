import util from 'node:util';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  namespace?: string;
  timestamp: string;
  data?: any;
}

export interface Logger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  debug(message: string, data?: any): void;
  child(namespace: string): Logger;
}

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

class DefaultLogger implements Logger {
  constructor(private namespace?: string) {}

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      namespace: this.namespace,
      timestamp: new Date().toISOString(),
      data,
    };

    let levelColor = COLORS.reset;
    switch(level) {
      case 'error': levelColor = COLORS.red; break;
      case 'warn':  levelColor = COLORS.yellow; break;
      case 'info':  levelColor = COLORS.blue; break;
      case 'debug': levelColor = COLORS.gray; break;
    }

    const timeStr = `${COLORS.dim}[${entry.timestamp}]${COLORS.reset}`;
    const levelStr = `${levelColor}${COLORS.bold}[${entry.level.toUpperCase()}]${COLORS.reset}`;
    const nsStr = entry.namespace ? ` ${COLORS.blue}[${entry.namespace}]${COLORS.reset}` : '';
    
    let formattedLog = `${timeStr} ${levelStr}${nsStr} ${entry.message}`;
    
    if (entry.data) {
      const formattedData = util.inspect(entry.data, { colors: true, depth: null });
      formattedLog += `\n${formattedData.split('\n').map(l => `  ${l}`).join('\n')}`;
    }

    switch (level) {
      case 'debug': console.debug(formattedLog); break;
      case 'info': console.info(formattedLog); break;
      case 'warn': console.warn(formattedLog); break;
      case 'error': console.error(formattedLog); break;
    }
  }

  info(message: string, data?: any) { this.log('info', message, data); }
  warn(message: string, data?: any) { this.log('warn', message, data); }
  error(message: string, data?: any) { this.log('error', message, data); }
  debug(message: string, data?: any) { this.log('debug', message, data); }
  
  child(namespace: string): Logger {
    const newNamespace = this.namespace ? `${this.namespace}:${namespace}` : namespace;
    return new DefaultLogger(newNamespace);
  }
}

export function createLogger(namespace?: string): Logger {
  return new DefaultLogger(namespace);
}

export const debugLogger = createLogger('core');
