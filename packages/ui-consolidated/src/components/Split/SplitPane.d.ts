import * as React from 'react';
/**
 * SplitPane component props
 */
export interface SplitPaneProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Minimum size of the panel in percentage
     * @default 10
     */
    minSize?: number;
    /**
     * Maximum size of the panel in percentage
     */
    maxSize?: number;
    /**
     * Default size of the panel in percentage
     */
    defaultSize?: number;
    /**
     * Whether the panel is collapsible
     * @default false
     */
    collapsible?: boolean;
}
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
declare const SplitPane: React.ForwardRefExoticComponent<SplitPaneProps & React.RefAttributes<HTMLDivElement>>;
export { SplitPane };
//# sourceMappingURL=SplitPane.d.ts.map