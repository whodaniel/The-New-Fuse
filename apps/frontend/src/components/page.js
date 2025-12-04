import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppCreator } from './AppCreator';
import { AppStacker } from './AppStacker/AppStacker';
export default function Page() {
    return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [_jsx(AppCreator, {}), _jsx(AppStacker, {})] }));
}
