"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s)
                if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareModal = exports.ExportModal = exports.ShareButton = exports.ExportButton = exports.DataExportAndShare = void 0;
var react_1 = require("react");
var DataFetcher_1 = require("./DataFetcher");
var useDataSource_1 = require("./useDataSource");
var DataExportAndShare = function (_a) {
    var data = _a.data;
    var _b = (0, react_1.useState)({
        format: 'csv',
    }), exportOptions = _b[0], setExportOptions = _b[1];
    var _c = (0, react_1.useState)({
        platform: 'email',
    }), shareOptions = _c[0], setShareOptions = _c[1];
    var _d = (0, react_1.useState)(false), isExportModalOpen = _d[0], setExportModalOpen = _d[1];
    var _e = (0, react_1.useState)(false), isShareModalOpen = _e[0], setShareModalOpen = _e[1];
    var handleExport = function () {
        var exporter = new DataFetcher_1.DataFetcher(data);
        var exportedData = exporter.export(exportOptions);
        // Implement download or save functionality here
        
    };
    var handleShare = function () {
        var dataSource = (0, useDataSource_1.useDataSource)(shareOptions.platform);
        // Implement share functionality here
        
    };
    return onClick = { function() { return setExportModalOpen(true); } } > Export;
    Data < /button>
        < button;
    onClick = { function() { return setShareModalOpen(true); } } > Share;
    Data < /button>;
    {
        isExportModalOpen && Export;
        Data < /h2>
            < select;
        value = { exportOptions, : .format };
        onChange = { function(e) {
                return setExportOptions(__assign(__assign({}, exportOptions), { format: e.target.value }));
            } } >
            value;
        "csv" > CSV < /option>
            < option;
        value = "json" > JSON < /option>
            < option;
        value = "xml" > XML < /option>
            < /select>
            < button;
        onClick = { handleExport } > Export < /button>
            < button;
        onClick = { function() { return setExportModalOpen(false); } } > Cancel < /button>
            < /div>;
    }
    {
        isShareModalOpen && Share;
        Data < /h2>
            < select;
        value = { shareOptions, : .platform };
        onChange = { function(e) {
                return setShareOptions(__assign(__assign({}, shareOptions), { platform: e.target.value }));
            } } >
            value;
        "email" > Email < /option>
            < option;
        value = "slack" > Slack < /option>
            < option;
        value = "google-drive" > Google;
        Drive < /option>
            < /select>
            < button;
        onClick = { handleShare } > Share < /button>
            < button;
        onClick = { function() { return setShareModalOpen(false); } } > Cancel < /button>
            < /div>;
    }
    /div>;
    ;
};
exports.DataExportAndShare = DataExportAndShare;
var ExportButton = function () { return (Export < /button>); };
exports.ExportButton = ExportButton;
var ShareButton = function () { return (Share < /button>); };
exports.ShareButton = ShareButton;
var ExportModal = function () {
    return Export;
    Options < /h2>
        < select >
        value;
    "csv" > CSV < /option>
        < option;
    value = "json" > JSON < /option>
        < option;
    value = "xml" > XML < /option>
        < /select>
        < button > Export < /button>
        < button > Cancel < /button>
        < /div>;
    ;
};
exports.ExportModal = ExportModal;
var ShareModal = function () {
    return Share;
    Options < /h2>
        < select >
        value;
    "email" > Email < /option>
        < option;
    value = "slack" > Slack < /option>
        < option;
    value = "google-drive" > Google;
    Drive < /option>
        < /select>
        < button > Share < /button>
        < button > Cancel < /button>
        < /div>;
    ;
};
exports.ShareModal = ShareModal;
//# sourceMappingURL=DataExportAndShare.js.map