"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentThread = void 0;
var react_1 = require("react");
var Button_1 = require("../../../../core/components/ui/Button");
var Avatar_1 = require("../../../../core/components/ui/Avatar");
var date_fns_1 = require("date-fns");
var CommentThread = function (_a) {
    var _b;
    var comment = _a.comment, currentUser = _a.currentUser, onReply = _a.onReply, onResolve = _a.onResolve, onReact = _a.onReact, _c = _a.className, className = _c === void 0 ? '' : _c;
    var _d = (0, react_1.useState)(''), replyContent = _d[0], setReplyContent = _d[1];
    var _e = (0, react_1.useState)(false), isReplying = _e[0], setIsReplying = _e[1];
    var handleSubmitReply = function () {
        if (replyContent.trim()) {
            onReply(replyContent, comment.id);
            setReplyContent('');
            setIsReplying(false);
        }
    };
    var renderComment = function (comment, isReply) {
        if (isReply === void 0) {
            isReply = false;
        }
        return className = { "flex space-x-3 ": .concat(isReply ? 'ml-8 mt-3' : '') } >
            src;
        {
            comment.author.avatar;
        }
        alt = { comment, : .author.name };
        size = "sm" /  >
            className;
        "flex-1" >
            className;
        "bg-white rounded-lg border p-3" >
            className;
        "flex items-center justify-between" >
            className;
        "flex items-center space-x-2" >
            className;
        "font-medium text-gray-900" >
            { comment, : .author.name }
            < /span>
            < span;
        className = "text-sm text-gray-500" >
            {}(0, date_fns_1.formatDistanceToNow)(new Date(comment.createdAt), {
                addSuffix: true,
            });
    }
        < /span>
        < /div>;
    {
        comment.author.id === currentUser.id && !comment.resolved && onClick;
        {
            function () { return onResolve(comment); }
        }
        className = "text-sm text-gray-500 hover:text-gray-700" >
            Resolve
            < /button>;
    }
    /div>
        < p;
    className = "mt-1 text-gray-800" > { comment, : .content } < /p>;
    { /* Attachments */ }
    {
        comment.attachments && comment.attachments.length > 0 && className;
        "mt-2 space-y-2" >
            { comment, : .attachments.map(function (attachment) {
                    return key = { attachment, : .id };
                    className = "flex items-center space-x-2 text-sm" >
                        { attachment, : .type === 'image' ? src = { attachment, : .url } : , alt = { attachment, : .name }, className = "h-20 w-20 object-cover rounded" /  >  };
                }) }(href, { attachment, : .url }, className = "text-blue-600 hover:underline", target = "_blank", rel = "noopener noreferrer" >
                { attachment, : .name }
                < /a>);
    }
    /div>;
    ;
};
/div>;
{ /* Reactions */ }
{
    comment.reactions && comment.reactions.length > 0 && className;
    "mt-2 flex flex-wrap gap-2" >
        { comment, : .reactions.map(function (reaction) {
                return key = { reaction, : .type };
                onClick = { function() { return onReact(comment.id, reaction.type); } };
                className = { "inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-xs ": .concat(reaction.users.includes(currentUser.id)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800') } >
                    { reaction, : .type } < /span>
                    < span > { reaction, : .count } < /span>
                    < /button>;
            }) };
}
/div>;
{ /* Actions */ }
className;
"mt-2 flex items-center space-x-4 text-sm" >
    onClick;
{
    function () { return setIsReplying(!isReplying); }
}
className = "text-gray-500 hover:text-gray-700" >
    Reply
    < /button>
    < button;
onClick = { function() { return onReact(comment.id, '👍'); } };
className = "text-gray-500 hover:text-gray-700" >
    React
    < /button>
    < /div>
    < /div>;
{ /* Replies */ }
{
    comment.replies && comment.replies.length > 0 && className;
    "mt-3" >
        { comment, : .replies.map(function (reply) { return key = { reply, : .id } > {} < /div>; }) };
}
/div>;
{ /* Reply Input */ }
{
    isReplying && className;
    "mt-3 ml-8" >
        value;
    {
        replyContent;
    }
    onChange = { function(e) { return setReplyContent(e.target.value); } };
    placeholder = "Write a reply...";
    className = "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    rows = { 3:  } /  >
        className;
    "mt-2 flex justify-end space-x-2" >
        variant;
    "outline";
    size = "sm";
    onClick = { function() { return setIsReplying(false); } } >
        Cancel
        < /Button_1.Button>
        < Button_1.Button;
    variant = "primary";
    size = "sm";
    onClick = { handleSubmitReply };
    disabled = {};
    replyContent.trim();
}
 >
    Reply
    < /Button_1.Button>
    < /div>
    < /div>;
/div>
    < /div>;
;
;
return className = { className } >
    {};
{
    comment.resolved && className;
    "mt-2 flex items-center space-x-2 text-sm text-gray-500" >
    ;
    Resolved;
    by;
    {
        (_b = comment.resolvedBy) === null || _b === void 0 ? void 0 : _b.name;
    }
    /span>;
    /span>;
    {
        (0, date_fns_1.formatDistanceToNow)(new Date(comment.resolvedAt), {
            addSuffix: true,
        });
    }
    /span>
        < /div>;
}
/div>;
;
;
exports.CommentThread = CommentThread;
//# sourceMappingURL=CommentThread.js.map