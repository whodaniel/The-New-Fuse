import React from 'react';
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Tooltip } from '../Tooltip.js';
import { Button } from '../../Button.js';

describe('Tooltip Snapshots', () => {
  it('renders basic tooltip correctly', () => {
    assertSnapshot(
      <Tooltip content="This is a tooltip">
        <Button>Hover me</Button>
      </Tooltip>
    );
  });

  it('renders tooltip with custom side', () => {
    assertSnapshot(
      <>
        <Tooltip content="Top tooltip" side="top">
          <Button>Top</Button>
        </Tooltip>
        <Tooltip content="Right tooltip" side="right">
          <Button>Right</Button>
        </Tooltip>
        <Tooltip content="Bottom tooltip" side="bottom">
          <Button>Bottom</Button>
        </Tooltip>
        <Tooltip content="Left tooltip" side="left">
          <Button>Left</Button>
        </Tooltip>
      </>
    );
  });

  it('renders tooltip with custom alignment', () => {
    assertSnapshot(
      <>
        <Tooltip content="Start aligned" align="start">
          <Button>Start</Button>
        </Tooltip>
        <Tooltip content="Center aligned" align="center">
          <Button>Center</Button>
        </Tooltip>
        <Tooltip content="End aligned" align="end">
          <Button>End</Button>
        </Tooltip>
      </>
    );
  });

  it('renders tooltip with delay', () => {
    assertSnapshot(
      <Tooltip content="Delayed tooltip" delayDuration={500}>
        <Button>Delayed</Button>
      </Tooltip>
    );
  });

  it('renders tooltip with HTML content', () => {
    assertSnapshot(
      <Tooltip content={
        <div className="space-y-2">
          <p className="font-semibold">Rich Content</p>
          <p className="text-sm text-gray-500">With multiple lines</p>
          <div className="h-1 w-full bg-gray-200 rounded" />
          <p className="text-xs">And custom formatting</p>
        </div>
      }>
        <Button>Rich Tooltip</Button>
      </Tooltip>
    );
  });
});