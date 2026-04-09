import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { BaseNode } from '../base-node';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Wrap in ReactFlowProvider as Handles need it
const renderNode = (props: any) => {
  return render(
    <ReactFlowProvider>
      <BaseNode {...props} />
    </ReactFlowProvider>
  );
};

describe('BaseNode', () => {
  it('renders without error', () => {
    renderNode({
      id: '1',
      data: { name: 'Test Node', type: 'test', config: {} },
    });
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('displays error indicator when data.error is present', () => {
    const errorMsg = 'Validation Failed';
    renderNode({
      id: '1',
      data: { name: 'Test Node', type: 'test', config: {}, error: errorMsg },
    });

    // Check for the red ring class which indicates error state
    // The node-container wraps the Card
    // We can find the element with text "Test Node" and go up to the container
    const titleElement = screen.getByText('Test Node');
    // Closest .node-container might not work in JSDOM if not supported, but let's try
    // Or we can query by a specific testid if we added one, but let's try querying by class

    // The BaseNode component has: <div className={`node-container ${hasError ? 'ring-red-500 ...' : ''}`}>
    // We can just check if any element has class ring-red-500

    const errorContainer = document.querySelector('.ring-red-500');
    expect(errorContainer).toBeInTheDocument();
  });
});
