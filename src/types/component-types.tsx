import { FC, PropsWithChildren } from "react";

export type ModuleProps = {
  className?: string;
};

export type ModuleFC<P = {}> = FC<PropsWithChildren<P & ModuleProps>>;
