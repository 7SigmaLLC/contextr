// Type definitions for other modules
declare module 'body-parser' {
  function json(): any;
  function urlencoded(options: { extended: boolean }): any;
  export { json, urlencoded };
}

declare module 'open' {
  function open(target: string, options?: any): Promise<any>;
  export default open;
}

declare module 'commander' {
  class Command {
    name(name: string): Command;
    description(desc: string): Command;
    version(version: string): Command;
    command(name: string): Command;
    option(flags: string, description: string, defaultValue?: any): Command;
    action(fn: (...args: any[]) => void): Command;
    parse(argv: string[]): Command;
    help(): void;
    on(event: string, listener: (...args: any[]) => void): Command;
    commands: Command[];
    name(): string;
  }

  function createCommand(): Command;

  export { Command, createCommand };
}
