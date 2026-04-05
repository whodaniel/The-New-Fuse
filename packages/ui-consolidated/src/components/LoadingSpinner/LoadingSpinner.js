import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
const LoadingSpinner = ({ className }) => {
    return (_jsx("div", { className: cn('flex items-center justify-center w-full h-full', className), children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" }) }));
};
export { LoadingSpinner };
