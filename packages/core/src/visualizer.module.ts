import { Module } from '@nestjs/common';
import { ProjectVisualizer } from './project_visualizer.js';

@Module({
  providers: [ProjectVisualizer],
  exports: [ProjectVisualizer],
})
export class VisualizerModule {}
