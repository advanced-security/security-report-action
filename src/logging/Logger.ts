
export interface Logger {

  info(message: string): void;

  debug(message: string): void;

  warning(message: string): void;

  error(message: string): void;

  startLogGroup(name: string): void;

  endLogGroup(): void;
}