declare module 'handlebars' {
  export interface HandlebarsTemplateDelegate<T = any> {
    (context: T, options?: RuntimeOptions): string;
  }
  
  export function compile<T = any>(
    template: string,
    options?: CompileOptions
  ): HandlebarsTemplateDelegate<T>;
  
  export interface RuntimeOptions {
    partial?: boolean;
    data?: any;
    helpers?: Record<string, Function>;
  }
  
  export interface CompileOptions {
    data?: boolean;
    compat?: boolean;
    knownHelpers?: Record<string, boolean>;
    knownHelpersOnly?: boolean;
    noEscape?: boolean;
    strict?: boolean;
    assumeObjects?: boolean;
    preventIndent?: boolean;
    ignoreStandalone?: boolean;
    explicitPartialContext?: boolean;
  }
}
