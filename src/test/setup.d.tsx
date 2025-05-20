import { Container } from "inversify";
import "reflect-metadata";
export declare const container: Container;
export declare const createMock: <T>(overrides?: Partial<T>) => T;
