import React from 'react';
import { Button } from '../Button.js';
import { Tooltip } from '../Tooltip.js';
import { cn } from '@/lib/utils';
export function SidebarItem({ icon: Icon, label, onClick, view, disabled, tooltip, active, expanded }) {
    const content = (<Button variant={active ? 'default' : 'ghost'} size={expanded ? 'default' : 'icon'} onClick={onClick} disabled={disabled} className={cn('w-full justify-start gap-2', expanded ? 'px-4' : 'px-2', active && 'bg-primary/10 hover:bg-primary/20')}>
      <Icon className={cn('h-5 w-5', active && 'text-primary')}/>
      {expanded && <span>{label}</span>}
    </Button>);
    if (tooltip && !expanded) {
        return (<Tooltip content={tooltip} side="right">
        {content}
      </Tooltip>);
    }
    return content;
}
//# sourceMappingURL=SidebarItem.js.map