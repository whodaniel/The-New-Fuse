declare const dbConfig: {
  url: unknown;
  options: {
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
    autoIndex: boolean;
  };
};
export declare const createIndexes: () => Promise<void>;
export { dbConfig };
