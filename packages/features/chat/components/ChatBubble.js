"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatBubble = ChatBubble;
import request_1 from '@/utils/request';
function ChatBubble({ message, type, popMsg }) {
    var _a;
    const isUser = type === "user";
    return className = "flex justify-center items-end w-full bg-theme-bg-secondary" >
        className;
    "py-8 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col" >
        className;
    "flex gap-x-5" >
        user;
    {
        {
            uid: isUser ? (_a = (0, request_1.userFromStorage)()) === null || _a === void 0 ? void 0 : _a.username : "system";
        }
    }
    role = { type } /  >
        className;
    "whitespace-pre-line text-white font-normal text-sm md:text-sm flex flex-col gap-y-1 mt-2" >
        { message }
        < /span>
        < /div>
        < /div>
        < /div>;
    ;
}
//# sourceMappingURL=ChatBubble.js.map
//# sourceMappingURL=ChatBubble.js.map