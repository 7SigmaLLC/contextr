// Type definitions for fast-glob
declare module 'fast-glob' {
  namespace fastGlob {
    interface Options {
      onlyFiles?: boolean;
      deep?: number | boolean;
      [key: string]: any;
    }
    
    function sync(patterns: string | string[], options?: Options): string[];
    function isDynamicPattern(pattern: string): boolean;
  }
  
  function fastGlob(patterns: string | string[], options?: fastGlob.Options): Promise<string[]>;
  
  export = fastGlob;
}
