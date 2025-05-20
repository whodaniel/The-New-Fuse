import React from "react";
declare const cardVariants: (
  props?: import("class-variance-authority/dist/types").ClassProp,
) => string;
export interface CardProps {}
declare const Card: React.ForwardRefExoticComponent<
  CardProps & React.RefAttributes<HTMLDivElement>
>;
export { Card, cardVariants };
