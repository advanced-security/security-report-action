import { Logger } from './Logger';

export class NullLogger implements Logger {
  debug(message: string): void { }
  info(message: string): void { }
  warning(message: string): void { }
  error(message: string): void { }
  startLogGroup(name: string): void { }
  endLogGroup(): void { }
}