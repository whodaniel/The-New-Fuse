import React, { FC } from "react";
export interface HeaderProps {
    title?: string;
    actions?: React.ReactNode;
    user?: {
        name: string;
        avatar?: string;
    };
}
export declare const Header: FC<HeaderProps>;
