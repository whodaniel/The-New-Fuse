import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
    value?: number;
    max?: number;
    showValue?: boolean;
}
declare const Progress: React.ForwardRefExoticComponent<ProgressProps & React.RefAttributes<HTMLDivElement>>;
export { Progress };
//# sourceMappingURL=Progress.d.ts.map