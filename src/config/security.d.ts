import { SessionOptions } from "express-session";
declare const sessionConfig: SessionOptions;
declare const jwtConfig: {
  secretOrKey: unknown;
  jwtFromRequest: (req: unknown) => any;
};
export { sessionConfig, jwtConfig };
