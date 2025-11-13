import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const labelVariants: (props?: ({
    variant?: "error" | "default" | "required" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement>, VariantProps<typeof labelVariants> {
    error?: boolean;
    required?: boolean;
    optional?: boolean;
}
declare const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>;
export { Label, labelVariants };
//# sourceMappingURL=Label.d.ts.map