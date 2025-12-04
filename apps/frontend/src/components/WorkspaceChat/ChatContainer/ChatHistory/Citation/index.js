var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { decode as HTMLDecode } from "he";
import truncate from "truncate";
import { ModalWrapper } from "@/components/ModalWrapper";
import { middleTruncate } from "@/utils/directories";
import { FileText, Info, Link as LinkIcon, XCircle, } from "lucide-react";
import ConfluenceLogo from "@/media/dataConnectors/confluence.png";
import { toPercentString } from "@/utils/numbers";
var ICONS = {
    file: FileText,
    link: LinkIcon,
    youtube: YoutubeLogo,
    github: GithubLogo,
    confluence: function (_a) {
        var className = _a.className, props = __rest(_a, ["className"]);
        return (_jsx("img", __assign({ src: ConfluenceLogo, className: className, alt: "Confluence" }, props)));
    },
};
function combineLikeSources(sources) {
    var combined = {};
    sources.forEach(function (source) {
        var title = source.title, _a = source.text, text = _a === void 0 ? "" : _a, _b = source.chunkSource, chunkSource = _b === void 0 ? "" : _b, _c = source.score, score = _c === void 0 ? null : _c;
        if (combined[title]) {
            combined[title].chunks.push({ text: text, chunkSource: chunkSource, score: score });
            combined[title].references += 1;
        }
        else {
            combined[title] = {
                title: title,
                chunks: [{ text: text, chunkSource: chunkSource, score: score }],
                references: 1,
            };
        }
    });
    return Object.values(combined);
}
function parseChunkSource(source) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var nullResponse = {
        isUrl: false,
        text: null,
        href: null,
        icon: "file",
    };
    if (!((_c = (_b = (_a = source.chunks) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.chunkSource) === null || _c === void 0 ? void 0 : _c.startsWith("link://")) &&
        !((_f = (_e = (_d = source.chunks) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.chunkSource) === null || _f === void 0 ? void 0 : _f.startsWith("confluence://")) &&
        !((_j = (_h = (_g = source.chunks) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.chunkSource) === null || _j === void 0 ? void 0 : _j.startsWith("github://"))) {
        return nullResponse;
    }
    try {
        var chunkSource = source.chunks[0].chunkSource;
        var url = new URL(chunkSource.split("link://")[1] ||
            chunkSource.split("confluence://")[1] ||
            chunkSource.split("github://")[1]);
        var text = url.host + url.pathname;
        var icon = "link";
        if (url.host.includes("youtube.com")) {
            text = source.title;
            icon = "youtube";
        }
        if (url.host.includes("github.com")) {
            text = source.title;
            icon = "github";
        }
        if (url.host.includes("atlassian.net")) {
            text = source.title;
            icon = "confluence";
        }
        return {
            isUrl: true,
            href: url.toString(),
            text: text,
            icon: icon,
        };
    }
    catch (_k) {
        return nullResponse;
    }
}
function Citation(_a) {
    var _b, _c;
    var source = _a.source, onClick = _a.onClick;
    var title = source.title;
    if (!title)
        return null;
    var chunkSourceInfo = parseChunkSource(source);
    var truncatedTitle = (_b = chunkSourceInfo === null || chunkSourceInfo === void 0 ? void 0 : chunkSourceInfo.text) !== null && _b !== void 0 ? _b : middleTruncate(title, 25);
    var CitationIcon = ICONS[(_c = chunkSourceInfo === null || chunkSourceInfo === void 0 ? void 0 : chunkSourceInfo.icon) !== null && _c !== void 0 ? _c : "file"];
    return (_jsxs("div", { className: "w-fit flex flex-row justify-center items-center cursor-pointer text-sky-400", onClick: onClick, children: [_jsx(CitationIcon, { className: "w-6 h-6", weight: "bold" }), _jsx("p", { className: "text-sm font-medium whitespace-nowrap", children: truncatedTitle })] }));
}
function CitationDetailModal(_a) {
    var source = _a.source, onClose = _a.onClose;
    var references = source.references, title = source.title, chunks = source.chunks;
    var _b = parseChunkSource(source), isUrl = _b.isUrl, webpageUrl = _b.text, linkTo = _b.href;
    return (_jsx(ModalWrapper, { isOpen: true, children: _jsxs("div", { className: "w-full max-w-2xl bg-theme-bg-secondary rounded-lg shadow border-2 border-theme-modal-border overflow-hidden", children: [_jsxs("div", { className: "relative p-6 border-b rounded-t border-theme-modal-border", children: [_jsx("div", { className: "w-full flex gap-x-2 items-center", children: isUrl && linkTo ? (_jsx("a", { href: linkTo, target: "_blank", rel: "noreferrer", className: "text-xl font-semibold text-white overflow-hidden overflow-ellipsis whitespace-nowrap hover:underline hover:text-blue-300 flex items-center gap-x-1", children: _jsxs("h3", { className: "flex items-center gap-x-1", children: [webpageUrl, _jsx(ArrowSquareOut, {})] }) })) : (_jsx("h3", { className: "text-xl font-semibold text-white overflow-hidden overflow-ellipsis whitespace-nowrap", children: truncate(title, 45) })) }), references > 1 && (_jsxs("p", { className: "text-xs text-gray-400 mt-2", children: ["Referenced ", references, " times."] })), _jsx("button", { onClick: onClose, type: "button", className: "absolute top-4 right-4 transition-all duration-300 bg-transparent rounded-lg text-sm p-1 inline-flex items-center hover:bg-theme-modal-border hover:border-theme-modal-border hover:border-opacity-50 border-transparent border", children: _jsx(XCircle, { size: 24, weight: "bold", className: "text-white" }) })] }), _jsx("div", { className: "h-full w-full overflow-y-auto", style: { maxHeight: "calc(100vh - 200px)" }, children: _jsxs("div", { className: "py-7 px-9 space-y-2 flex-col", children: [chunks.map(function (_a, idx) {
                                var text = _a.text, score = _a.score;
                                return (_jsxs("div", { children: [_jsx("div", { className: "pt-6 text-white", children: _jsxs("div", { className: "flex flex-col w-full justify-start pb-6 gap-y-1", children: [_jsx("p", { className: "text-white whitespace-pre-line", children: HTMLDecode(omitChunkHeader(text || "")) }), !!score && (_jsx("div", { className: "w-full flex items-center text-xs text-white/60 gap-x-2 cursor-default", children: _jsxs("div", { "data-tooltip-id": "similarity-score", "data-tooltip-content": "This is the semantic similarity score of this chunk of text compared to your query calculated by the vector database.", className: "flex items-center gap-x-1", children: [_jsx(Info, { size: 14 }), _jsxs("p", { children: [toPercentString(score), " match"] })] }) }))] }) }), idx !== chunks.length - 1 && (_jsx("hr", { className: "border-theme-modal-border" }))] }, idx));
                            }), _jsx("div", { className: "mb-6" })] }) })] }) }));
}
function omitChunkHeader(text) {
    if (!text.startsWith("<document_metadata>"))
        return text;
    return text.split("</document_metadata>")[1].trim();
}
export default function Citations(_a) {
    var _b = _a.sources, sources = _b === void 0 ? [] : _b;
    if (sources.length === 0)
        return null;
    var _c = useState(false), open = _c[0], setOpen = _c[1];
    var _d = useState(null), selectedSource = _d[0], setSelectedSource = _d[1];
    var combinedSources = combineLikeSources(sources);
    return (_jsxs("div", { className: "flex flex-col mt-4 justify-left", children: [_jsx("button", { onClick: function () { return setOpen(!open); }, className: "border-none text-white/50 light:text-black/50 font-medium italic text-sm text-left ml-14 pt-2 ".concat(open ? "pb-2" : "", " hover:text-white/75 hover:light:text-black/75 transition-all duration-300"), children: open ? "Hide Citations" : "Show Citations" }), open && (_jsx("div", { className: "flex flex-wrap md:flex-row md:items-center gap-4 overflow-x-scroll mt-1 doc__source ml-14", children: combinedSources.map(function (source) { return (_jsx(Citation, { source: source, onClick: function () { return setSelectedSource(source); } }, source.title)); }) })), selectedSource && (_jsx(CitationDetailModal, { source: selectedSource, onClose: function () { return setSelectedSource(null); } }))] }));
}
