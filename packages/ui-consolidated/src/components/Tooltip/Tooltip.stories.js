import { Tooltip } from './Tooltip';
import { Button } from '../Button';
const meta = {
    title: 'Components/Tooltip',
    component: Tooltip,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        side: {
            control: { type: 'select' },
            options: ['top', 'right', 'bottom', 'left'],
        },
    },
};
export default meta;
export const Default = {
    args: {
        content: 'This is a tooltip',
    },
    render: (args) => (<Tooltip {...args}>
      <Button>Hover me</Button>
    </Tooltip>),
};
export const Positions = {
    render: () => (<div className="flex flex-wrap gap-4 justify-center">
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
    </div>),
};
export const WithVariousContent = {
    render: () => (<div className="flex flex-wrap gap-4 justify-center">
      <Tooltip content="Short content">
        <Button>Short</Button>
      </Tooltip>
      <Tooltip content="This is a longer tooltip content that spans multiple lines">
        <Button>Long</Button>
      </Tooltip>
      <Tooltip content="Another tooltip">
        <Button>Another</Button>
      </Tooltip>
    </div>),
};
export const DifferentSides = {
    render: () => (<div className="flex flex-wrap gap-4 justify-center">
      <Tooltip content="Top side" side="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip content="Bottom side" side="bottom">
        <Button>Bottom</Button>
      </Tooltip>
    </div>),
};
export const WithCustomClass = {
    render: () => (<div className="flex flex-col items-center gap-4">
      <Tooltip content="Custom styled tooltip" className="custom-tooltip">
        <Button>Custom Styled</Button>
      </Tooltip>
    </div>),
};
export const WithRichContent = {
    render: () => (<Tooltip content={<div className="max-w-xs">
          <h4 className="font-semibold mb-1">Rich Tooltip</h4>
          <p className="text-xs">
            This tooltip contains rich content including text formatting, links, and more.
          </p>
          <div className="mt-2 pt-2 border-t border-border">
            <a href="#" className="text-xs text-primary hover:underline">
              Learn more
            </a>
          </div>
        </div>}>
      <Button>Rich Content</Button>
    </Tooltip>),
};
//# sourceMappingURL=Tooltip.stories.js.map