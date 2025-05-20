import * as React from 'react';
import { SplitPane } from './SplitPane.js';
import { cn } from '../../utils.js';
import './Split.css';

/**
 * Split component props
 */
export interface SplitProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Direction of the split
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical';

  /**
   * Initial sizes of the panels in percentage
   * @default [50, 50]
   */
  initialSizes?: number[];

  /**
   * Minimum size of each panel in percentage
   * @default 10
   */
  minSize?: number;

  /**
   * Whether the split is resizable
   * @default true
   */
  resizable?: boolean;

  /**
   * Size of the gutter in pixels
   * @default 4
   */
  gutterSize?: number;

  /**
   * Callback when sizes change
   */
  onChange?: (sizes: number[]) => void;

  /**
   * Children to render in the split panels
   */
  children: React.ReactNode;
}

/**
 * Split component for creating resizable split views
 *
 * @example
 * // Basic usage
 * <Split>
 *   <div>Left panel</div>
 *   <div>Right panel</div>
 * </Split>
 *
 * // Vertical split
 * <Split direction="vertical">
 *   <div>Top panel</div>
 *   <div>Bottom panel</div>
 * </Split>
 *
 * // With custom initial sizes
 * <Split initialSizes={[30, 70]}>
 *   <div>Smaller panel</div>
 *   <div>Larger panel</div>
 * </Split>
 *
 * // With size change callback
 * <Split onChange={(sizes) => console.log(sizes)}>
 *   <div>Left panel</div>
 *   <div>Right panel</div>
 * </Split>
 */
const Split = React.forwardRef<HTMLDivElement, SplitProps>(
  ({
    className,
    direction = 'horizontal',
    initialSizes = [50, 50],
    minSize = 10,
    resizable = true,
    gutterSize = 4,
    onChange,
    children,
    ...props
  }, ref) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [sizes, setSizes] = React.useState<number[]>(initialSizes);
    // refs for panels and gutters to set CSS variables
    const panelRefs = React.useRef<Array<HTMLDivElement | null>>([]);
    const gutterRefs = React.useRef<Array<HTMLDivElement | null>>([]);

    const [isDragging, setIsDragging] = React.useState<boolean>(false);
    const [dragIndex, setDragIndex] = React.useState<number>(-1);

    // update CSS variables when sizes or gutterSize change
    React.useEffect(() => {
      panelRefs.current.forEach((el, i) => el?.style.setProperty('--split-panel-basis', `${sizes[i]}%`));
      gutterRefs.current.forEach(el => el?.style.setProperty('--gutter-size', `${gutterSize}px`));
    }, [sizes, gutterSize]);

    // Validate children
    const childrenArray = React.Children.toArray(children);
    if (childrenArray.length !== initialSizes.length) {
      console.warn(`Split component expected ${initialSizes.length} children but got ${childrenArray.length}`);
    }

    // Handle mouse down on gutter
    const handleGutterMouseDown = (index: number, e: React.MouseEvent) => {
      if (!resizable) return;

      e.preventDefault();
      setIsDragging(true);
      setDragIndex(index);
    };

    // Handle mouse move
    React.useEffect(() => {
      if (!isDragging || dragIndex === -1 || !containerRef.current) return;

      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const containerSize = direction === 'horizontal' ? containerRect.width : containerRect.height;
        const mousePosition = direction === 'horizontal' ? e.clientX - containerRect.left : e.clientY - containerRect.top;

        // Calculate new sizes
        const newSizes = [...sizes];
        const totalSize = newSizes.reduce((acc, size) => acc + size, 0);
        const panelIndex = dragIndex;
        const nextPanelIndex = dragIndex + 1;

        // Calculate new size for the panel
        const newSizePercentage = (mousePosition / containerSize) * 100;
        const sizeDiff = newSizePercentage - newSizes.slice(0, panelIndex + 1).reduce((acc, size) => acc + size, 0) + newSizes[panelIndex];

        // Ensure minimum size
        if (newSizes[panelIndex] + sizeDiff < minSize || newSizes[nextPanelIndex] - sizeDiff < minSize) {
          return;
        }

        // Update sizes
        newSizes[panelIndex] += sizeDiff;
        newSizes[nextPanelIndex] -= sizeDiff;

        // Normalize sizes to ensure they sum to 100%
        const newTotalSize = newSizes.reduce((acc, size) => acc + size, 0);
        const normalizedSizes = newSizes.map(size => (size / newTotalSize) * totalSize);

        setSizes(normalizedSizes);
        onChange?.(normalizedSizes);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        setDragIndex(-1);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, dragIndex, direction, sizes, minSize, onChange]);

    return (
      <div
        // Use a callback ref to set both the forwarded ref and our internal ref
        ref={(node) => {
          // Set the forwarded ref
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            // Use a type assertion to avoid the error
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
          // Set our internal ref
          containerRef.current = node;
        }}
        className={cn(
          'flex',
          direction === 'horizontal' ? 'flex-row' : 'flex-col',
          isDragging && 'select-none',
          className
        )}
        {...props}
      >
        {childrenArray.map((child, index) => (
          <React.Fragment key={index}>
            <div
              ref={el => panelRefs.current[index] = el}
              className={cn(
                'panel',
                'flex-shrink-0 overflow-auto',
              )}
            >
              {child}
            </div>

            {index < childrenArray.length - 1 && (
              <div
                ref={el => gutterRefs.current[index] = el}
                className={cn(
                  'gutter',
                  direction === 'horizontal' ? 'gutterHorizontal cursor-col-resize' : 'gutterVertical cursor-row-resize',
                  resizable ? 'bg-border hover:bg-primary/20' : 'bg-transparent',
                  isDragging && dragIndex === index && 'bg-primary'
                )}
                onMouseDown={(e) => handleGutterMouseDown(index, e)}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
);

Split.displayName = 'Split';

export { Split, SplitPane };
