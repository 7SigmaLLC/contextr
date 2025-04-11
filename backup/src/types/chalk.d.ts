// Type definitions for chalk
declare module 'chalk' {
  interface ChalkFunction {
    (text: string): string;
    bold: ChalkFunction;
    blue: ChalkFunction;
    green: ChalkFunction;
    red: ChalkFunction;
    yellow: ChalkFunction;
    magenta: ChalkFunction;
    cyan: ChalkFunction;
    white: ChalkFunction;
    gray: ChalkFunction;
    grey: ChalkFunction;
    black: ChalkFunction;
    blueBright: ChalkFunction;
    redBright: ChalkFunction;
    greenBright: ChalkFunction;
    yellowBright: ChalkFunction;
    magentaBright: ChalkFunction;
    cyanBright: ChalkFunction;
    whiteBright: ChalkFunction;
    bgBlack: ChalkFunction;
    bgRed: ChalkFunction;
    bgGreen: ChalkFunction;
    bgYellow: ChalkFunction;
    bgBlue: ChalkFunction;
    bgMagenta: ChalkFunction;
    bgCyan: ChalkFunction;
    bgWhite: ChalkFunction;
  }

  const chalk: ChalkFunction;
  export default chalk;
}
