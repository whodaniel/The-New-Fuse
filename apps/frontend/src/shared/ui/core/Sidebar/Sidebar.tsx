import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../Button.js';
import { SidebarItem } from './SidebarItem.js';
import { cn } from '@/lib/utils';
export function Sidebar({ items, bottomItems = [], activeView, onViewChange, className, expanded = false, onExpandedChange, width = {
    expanded: 'w-64',
    collapsed: 'w-16'
} }) {
    const handleItemClick = (item) => {
        if (item.onClick) {
            item.onClick();
        }
        if (item.view && onViewChange) {
            onViewChange(item.view);
        }
    };
    return (<div className={cn('flex flex-col h-full bg-background border-r transition-all duration-300', expanded ? width.expanded : width.collapsed, className)}>
      <div className="flex flex-col flex-grow p-2 space-y-2">
        {items.map((item, index) => (<SidebarItem key={index} {...item} active={item.view === activeView} expanded={expanded} onClick={() => handleItemClick(item)}/>))}
      </div>

      <div className="p-2 space-y-2">
        {bottomItems.map((item, index) => (<SidebarItem key={index} {...item} active={item.view === activeView} expanded={expanded} onClick={() => handleItemClick(item)}/>))}
        
        {onExpandedChange && (<Button variant="ghost" size="icon" onClick={() => onExpandedChange(!expanded)} className="w-full justify-center">
            {expanded ? (<ChevronLeft className="h-5 w-5"/>) : (<ChevronRight className="h-5 w-5"/>)}
          </Button>)}
      </div>
    </div>);
}
//# sourceMappingURL=Sidebar.js.map