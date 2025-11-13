import * as React from 'react';
import { cn } from '../../utils';
/**
 * SplitPane component for use within a Split component
 *
 * @example
 * // Basic usage
 * <Split>
 *   <SplitPane minSize={20}>
 *     <div>Left panel</div>
 *   </SplitPane>
 *   <SplitPane>
 *     <div>Right panel</div>
 *   </SplitPane>
 * </Split>
 *
 * // With collapsible pane
 * <Split>
 *   <SplitPane collapsible>
 *     <div>Collapsible panel</div>
 *   </SplitPane>
 *   <SplitPane>
 *     <div>Main panel</div>
 *   </SplitPane>
 * </Split>
 */
const SplitPane = React.forwardRef(({ className, minSize, maxSize, defaultSize, collapsible = false, children, ...props }, ref) => {
    return (<div ref={ref} className={cn('h-full w-full', className)} data-min-size={minSize} data-max-size={maxSize} data-default-size={defaultSize} data-collapsible={collapsible} {...props}>
        {children}
      </div>);
});
SplitPane.displayName = 'SplitPane';
export { SplitPane };
//# sourceMappingURL=SplitPane.js.map