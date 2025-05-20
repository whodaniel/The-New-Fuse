"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageReactions = void 0;
import react_1 from 'react';
import material_1 from '@mui/material';
import icons_material_1 from '@mui/icons-material';
import data_1 from '@emoji-mart/data';
import react_2 from '@emoji-mart/react';
const COMMON_REACTIONS = ['👍', '❤️', '😂', '🎉', '🤔', '👀', '🚀', '💯'];
const MessageReactions = ({ message, currentUserId, size = 'medium', onAddReaction, onRemoveReaction }) => {
    var _a;
    const theme = (0, material_1.useTheme)();
    const [anchorEl, setAnchorEl] = (0, react_1.useState)(null);
    const [showEmojiPicker, setShowEmojiPicker] = (0, react_1.useState)(false);
    const handleAddReaction = async () => ;
    () => ;
    (emoji) => {
        try {
            await(onAddReaction === null || onAddReaction === void 0 ? void 0 : onAddReaction(message.id, emoji));
        }
        catch (error) {
            console.error('Error adding reaction:', error);
        }
        setAnchorEl(null);
    };
    const handleRemoveReaction = async () => ;
    () => ;
    (emoji) => {
        try {
            await(onRemoveReaction === null || onRemoveReaction === void 0 ? void 0 : onRemoveReaction(message.id, emoji));
        }
        catch (error) {
            console.error('Error removing reaction:', error);
        }
    };
    const handleEmojiSelect = (emoji) => {
        handleAddReaction(emoji.native);
        setShowEmojiPicker(false);
    };
    const renderReactionButton = (reaction) => {
        const hasReacted = reaction.users.includes(currentUserId);
        return key = { reaction, : .emoji };
        title = {} < material_1.Box >
            variant;
        "caption" >
            { reaction, : .users
                    .slice(0, 3)
                    .join(', ') };
        {
            reaction.users.length > 3 &&
                ` and ${reaction.users.length - 3} more`;
        }
        /material_1.Typography>
            < /material_1.Box>;
    };
     >
        badgeContent;
    {
        reaction.count;
    }
    color = "primary";
    sx = {};
    {
        '& .MuiBadge-badge';
        {
            fontSize: size === 'small' ? '0.6rem' : '0.75rem',
                minWidth;
            size === 'small' ? 16 : 20,
                height;
            size === 'small' ? 16 : 20;
        }
    }
};
 >
    size;
{
    size;
}
onClick = {}();
hasReacted
    ? handleRemoveReaction(reaction.emoji)
    : handleAddReaction(reaction.emoji);
sx = {};
{
    p: size === 'small' ? 0.5 : 1,
        bgcolor;
    hasReacted ? 'action.selected' : 'transparent',
        '&:hover';
    {
        bgcolor: hasReacted
            ? 'action.selected'
            : 'action.hover';
    }
}
 >
    variant;
{
    size === 'small' ? 'caption' : 'body2';
}
component = "span" >
    { reaction, : .emoji }
    < /material_1.Typography>
    < /material_1.IconButton>
    < /material_1.Badge>
    < /material_1.Tooltip>;
;
;
return sx = {};
{
    display: 'flex', alignItems;
    'center', flexWrap;
    'wrap', gap;
    0.5;
}
 >
    {}(_a = message.reactions) === null || _a === void 0 ? void 0 : _a.map(reaction => renderReactionButton(reaction));
size;
{
    size;
}
onClick = { e, setAnchorEl(e) { }, : .currentTarget };
sx = {};
{
    p: size === 'small' ? 0.5 : 1,
        color;
    theme.palette.text.secondary;
}
 >
    fontSize;
{
    size;
}
/>
    < /material_1.IconButton>
    < material_1.Popover;
open = {};
anchorEl = { anchorEl };
onClose = {}();
setAnchorEl(null);
anchorOrigin = {};
{
    vertical: 'top',
        horizontal;
    'left';
}
transformOrigin = {};
{
    vertical: 'bottom',
        horizontal;
    'left';
}
 >
    sx;
{
    {
        p: 1;
    }
}
 >
    { : .Box, sx = {} };
{
    width: 352;
}
 >
    data;
{
    data_1.default;
}
onEmojiSelect = { handleEmojiSelect };
theme = { theme, : .palette.mode };
skinTonePosition = "none" /  >
    /material_1.Box>;
sx = {};
{
    display: 'flex',
        flexWrap;
    'wrap',
        gap;
    0.5,
        maxWidth;
    280;
}
 >
    { COMMON_REACTIONS, : .map(emoji => key = { emoji }, size = "small", onClick = {}(), handleAddReaction(emoji)) } >
    variant;
"body2" > { emoji } < /material_1.Typography>
    < /material_1.IconButton>;
size;
"small";
onClick = {}();
setShowEmojiPicker(true);
sx = {};
{
    color: theme.palette.text.secondary;
}
 >
    />
    < /material_1.IconButton>
    < /material_1.Box>;
/material_1.Paper>
    < /material_1.Popover>
    < /material_1.Box>;
;
;
exports.MessageReactions = MessageReactions;
exports.default = exports.MessageReactions;
//# sourceMappingURL=MessageReactions.js.map