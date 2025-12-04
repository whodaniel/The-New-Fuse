import React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
declare const ScrollArea: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & React.RefAttributes<HTMLDivElement>>;
declare const ScrollBar: React.ForwardRefExoticComponent<Omit<ScrollAreaPrimitive.ScrollAreaScrollbarProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { ScrollArea, ScrollBar };
