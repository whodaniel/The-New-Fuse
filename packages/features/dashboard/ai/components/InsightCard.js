"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightCard = void 0;
var react_1 = require("react");
var material_1 = require("@mui/material");
var icons_material_1 = require("@mui/icons-material");
var InsightVisualization_1 = require("./InsightVisualization");
var getInsightIcon = function (type) {
    switch (type) {
        case 'trend':
            return icons_material_1.Timeline;
        case 'anomaly':
            return icons_material_1.Warning;
        case 'correlation':
            return icons_material_1.Analytics;
        case 'pattern':
            return icons_material_1.Timeline;
        case 'forecast':
            return icons_material_1.TrendingUp;
        case 'recommendation':
            return icons_material_1.Lightbulb;
        default:
            return icons_material_1.Analytics;
    }
};
var getImportanceColor = function (importance) {
    switch (importance) {
        case 'critical':
            return 'error';
        case 'high':
            return 'warning';
        case 'medium':
            return 'info';
        case 'low':
            return 'success';
        default:
            return 'default';
    }
};
var InsightCard = function (_a) {
    var insight = _a.insight, onAction = _a.onAction;
    var Icon = getInsightIcon(insight.type);
    var importanceColor = getImportanceColor(insight.importance);
    return sx = {};
    {
        height: '100%',
            display;
        'flex',
            flexDirection;
        'column',
            position;
        'relative',
        ;
    }
} >
    avatar, {};
sx;
{
    {
        backgroundColor: "".concat(importanceColor, ".light"),
            borderRadius;
        '50%',
            p;
        1,
            display;
        'flex',
            alignItems;
        'center',
            justifyContent;
        'center',
        ;
    }
}
 >
    color;
{
    importanceColor;
}
sx = {};
{
    fontSize: 24;
}
/>
    < /material_1.Box>;
title = {} < material_1.Typography;
variant = "h6";
component = "div" >
    { insight, : .title }
    < /material_1.Typography>;
subheader = {} < material_1.Box;
sx = {};
{
    display: 'flex', gap;
    1, mt;
    1;
}
 >
    size;
"small";
label = { insight, : .type };
color = "primary";
variant = "outlined" /  >
    size;
"small";
label = { insight, : .importance };
color = { importanceColor } /  >
    size;
"small";
label = { "": .concat(Math.round(insight.confidence * 100), "% confidence") };
variant = "outlined" /  >
    /material_1.Box>}/ >
    sx;
{
    {
        flexGrow: 1;
    }
}
 >
    variant;
"body2";
color = "text.secondary";
sx = {};
{
    mb: 2;
}
 >
    { insight, : .description }
    < /material_1.Typography>;
{
    insight.change && sx;
    {
        {
            display: 'flex', alignItems;
            'center', mb;
            2;
        }
    }
     >
        { insight, : .change.direction === 'up' ? color = "success" /  >  :  }(color, "error" /  > );
}
variant;
"body2";
color = { insight, : .change.direction === 'up'
        ? 'success.main'
        : 'error.main' };
sx = {};
{
    ml: 1;
}
 >
    { insight, : .change.percentage.toFixed(1) } % change
    < /material_1.Typography>
    < /material_1.Box>;
{
    insight.visualization && sx;
    {
        {
            height: 200, mb;
            2;
        }
    }
     >
        type;
    {
        insight.visualization.type;
    }
    data = { insight, : .visualization.data } /  >
        /material_1.Box>;
}
{
    insight.context && sx;
    {
        {
            mt: 2;
        }
    }
     >
        variant;
    "subtitle2";
    gutterBottom >
        Context
        < /material_1.Typography>
        < material_1.Typography;
    variant = "body2";
    color = "text.secondary" >
        { insight, : .context.timeframe };
    comparison: {
        ' ';
    }
    {
        insight.context.comparison;
    }
    /material_1.Typography>;
    {
        insight.context.factors.length > 0 && sx;
        {
            {
                display: 'flex', gap;
                0.5, mt;
                1;
            }
        }
         >
            { insight, : .context.factors.map(function (factor) { return key = { factor }; label = { factor }; size = "small"; variant = "outlined" /  > ; }) };
    }
    /material_1.Box>;
}
/material_1.Box>;
{
    insight.actions && insight.actions.length > 0 && sx;
    {
        {
            mt: 2;
        }
    }
     >
        variant;
    "subtitle2";
    gutterBottom >
        Recommended;
    Actions
        < /material_1.Typography>
        < material_1.Box;
    sx = {};
    {
        display: 'flex', gap;
        1;
    }
}
 >
    { insight, : .actions.map(function (action) {
            return key = { action, : .type };
            title = { action, : .description } >
                size;
            "small";
            onClick = { function() { return onAction === null || onAction === void 0 ? void 0 : onAction(action); } } >
                fontSize;
            "small" /  >
                /material_1.IconButton>
                < /material_1.Tooltip>;
        }) };
/material_1.Box>
    < /material_1.Box>;
/material_1.CardContent>
    < /material_1.Card>;
;
;
exports.InsightCard = InsightCard;
//# sourceMappingURL=InsightCard.js.map