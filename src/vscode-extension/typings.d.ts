declare module 'web-tree-sitter' {
  export default class TreeSitter {
    static init(): Promise<void>;
    static Language: {
      load(path: string): Promise<any>;
    };
  }

  export class Parser {
    setLanguage(language: any): void;
    parse(text: string): any;
  }
}
