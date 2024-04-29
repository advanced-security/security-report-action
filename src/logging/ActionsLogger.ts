import * as core from '@actions/core';
import { Logger } from './Logger';

export class ActionsLogger implements Logger {

  constructor() {
  }

  debug(message: string) {
    core.debug(message);
  }

  info(message: string) {
    core.info(message);
  }

  warning(message: string) {
    core.warning(message);
  }

  error(message: string) {
    core.error(message);
  }

  startLogGroup(name: string) {
    core.startGroup(name);
  }

  endLogGroup() {
    core.endGroup();
  }
}