import { Selection, BaseType } from "d3-selection";
import { ScaleLinear, ScaleTime } from "d3-scale";

export interface D3Node {
  id: string;
  x: number;
  y: number;
  data: TimelineEvent;
}

export interface D3Link {
  source: D3Node;
  target: D3Node;
  id: string;
}

export interface D3Selection
  extends Selection<BaseType, unknown, null, undefined> {
  call(zoom: unknown): void;
  transition(): this;
}

export interface TimelineScales {
  x: ScaleTime<number, number>;
  y: ScaleLinear<number, number>;
}

export interface ZoomBehavior {
  transform: (selection: D3Selection, transform: unknown) => void;
  scaleExtent: (extent: [number, number]) => this;
  on: (event: string, handler: (event: unknown) => void) => this;
}
