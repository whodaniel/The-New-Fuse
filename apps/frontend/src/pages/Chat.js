import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ChatInterface from "../components/features/ChatInterface";
export default function Chat() {
    return (_jsx("div", { className: "min-h-screen flex flex-col items-center justify-center bg-gray-50", children: _jsxs("div", { className: "w-full max-w-2xl p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Chat" }), _jsx(ChatInterface, {})] }) }));
}
