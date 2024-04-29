import * as core from '@actions/core';
import { Logger } from './Logger';
import { log } from 'console';

const enum LEVEL {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export class ConsoleLogger implements Logger {

  constructor() {
  }

  debug(message: string) {
    this.log(LEVEL.DEBUG, message);
  }

  info(message: string) {
    this.log(LEVEL.INFO, message);
  }

  warning(message: string) {
    this.log(LEVEL.WARNING, message);
  }

  error(message: string) {
    this.log(LEVEL.ERROR, message);
  }

  startLogGroup(name: string) {
  }

  endLogGroup() {
  }

  private log(level: LEVEL, message: string) {
    console.log(`[${level}]  ${message}`);
  }
}