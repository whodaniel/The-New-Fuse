import { forwardRef } from 'react';
export const Skeleton = forwardRef(({ className = '', ...props }, ref) => {
    return (<div className={`animate-pulse rounded-md bg-gray-200 ${className}}`} ref={ref} {...props}/>);
});
Skeleton.displayName = 'Skeleton';
//# sourceMappingURL=Skeleton.js.map