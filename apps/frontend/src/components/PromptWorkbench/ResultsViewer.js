import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, VStack, HStack, Text, Button, Tabs, TabList, TabPanels, Tab, TabPanel, Divider, Flex, useClipboard, Code } from '@chakra-ui/react';
import { FaDownload, FaCopy, FaCheck } from 'react-icons/fa';
export var ResultsViewer = function (_a) {
    var results = _a.results;
    var _b = useState(0), selectedResult = _b[0], setSelectedResult = _b[1];
    if (results.length === 0) {
        return (_jsx(Box, { textAlign: "center", py: 10, borderWidth: 1, borderRadius: "md", borderStyle: "dashed", children: _jsx(Text, { color: "gray.500", children: "No results to display. Run a generation first." }) }));
    }
    var currentResult = results[selectedResult];
    return (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Tabs, { variant: "enclosed", colorScheme: "blue", defaultIndex: 0, children: [_jsxs(TabList, { children: [_jsx(Tab, { children: "Results" }), _jsx(Tab, { children: "Comparison" }), _jsx(Tab, { children: "Analytics" })] }), _jsxs(TabPanels, { children: [_jsxs(TabPanel, { children: [_jsx(HStack, { spacing: 4, mb: 4, children: results.map(function (result, index) { return (_jsx(Button, { size: "sm", variant: selectedResult === index ? "solid" : "outline", colorScheme: "blue", onClick: function () { return setSelectedResult(index); }, children: result.testCase || "Result ".concat(index + 1) }, index)); }) }), _jsxs(Box, { mb: 4, children: [_jsx(Text, { fontWeight: "medium", mb: 1, children: "Generated at" }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: new Date(currentResult.timestamp).toLocaleString() })] }), _jsx(ResultPanel, { title: "Prompt", content: currentResult.prompt }), _jsx(Divider, { my: 4 }), _jsx(ResultPanel, { title: "Completion", content: currentResult.result })] }), _jsx(TabPanel, { children: _jsx(ComparisonView, { results: results }) }), _jsx(TabPanel, { children: _jsx(AnalyticsView, { results: results }) })] })] }), _jsx(Flex, { justifyContent: "flex-end", children: _jsx(Button, { leftIcon: _jsx(FaDownload, {}), onClick: function () {
                        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
                        var downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", "prompt_results.json");
                        document.body.appendChild(downloadAnchorNode);
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                    }, children: "Export Results" }) })] }));
};
var ResultPanel = function (_a) {
    var title = _a.title, content = _a.content;
    var _b = useClipboard(content), hasCopied = _b.hasCopied, onCopy = _b.onCopy;
    return (_jsxs(Box, { children: [_jsxs(HStack, { justifyContent: "space-between", mb: 2, children: [_jsx(Text, { fontWeight: "medium", children: title }), _jsx(Button, { size: "xs", leftIcon: hasCopied ? _jsx(FaCheck, {}) : _jsx(FaCopy, {}), onClick: onCopy, children: hasCopied ? 'Copied' : 'Copy' })] }), _jsx(Box, { p: 3, borderWidth: 1, borderRadius: "md", fontFamily: "mono", fontSize: "sm", whiteSpace: "pre-wrap", maxH: "300px", overflowY: "auto", bg: "gray.50", children: content })] }));
};
var ComparisonView = function (_a) {
    var results = _a.results;
    if (results.length <= 1) {
        return (_jsx(Box, { textAlign: "center", py: 4, children: _jsx(Text, { color: "gray.500", children: "Need at least two results to compare." }) }));
    }
    return (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsx(Text, { fontWeight: "medium", children: "Test Case Comparison" }), _jsx(Box, { overflowX: "auto", children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }, children: "Test Case" }), _jsx("th", { style: { padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }, children: "Prompt Length" }), _jsx("th", { style: { padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }, children: "Completion Length" }), _jsx("th", { style: { padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }, children: "Generated At" })] }) }), _jsx("tbody", { children: results.map(function (result, index) { return (_jsxs("tr", { children: [_jsx("td", { style: { padding: '8px', borderBottom: '1px solid #E2E8F0' }, children: result.testCase || "Result ".concat(index + 1) }), _jsxs("td", { style: { padding: '8px', borderBottom: '1px solid #E2E8F0' }, children: [result.prompt.length, " chars"] }), _jsxs("td", { style: { padding: '8px', borderBottom: '1px solid #E2E8F0' }, children: [result.result.length, " chars"] }), _jsx("td", { style: { padding: '8px', borderBottom: '1px solid #E2E8F0' }, children: new Date(result.timestamp).toLocaleString() })] }, index)); }) })] }) })] }));
};
var AnalyticsView = function (_a) {
    var results = _a.results;
    var getAverageLength = function () {
        var sum = results.reduce(function (acc, result) { return acc + result.result.length; }, 0);
        return Math.round(sum / results.length);
    };
    return (_jsxs(VStack, { spacing: 6, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Text, { fontWeight: "medium", mb: 3, children: "Completion Statistics" }), _jsxs(HStack, { spacing: 6, children: [_jsxs(Box, { p: 4, borderWidth: 1, borderRadius: "md", flex: 1, children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Average Length" }), _jsxs(Text, { fontSize: "2xl", fontWeight: "bold", children: [getAverageLength(), " chars"] })] }), _jsxs(Box, { p: 4, borderWidth: 1, borderRadius: "md", flex: 1, children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Total Completions" }), _jsx(Text, { fontSize: "2xl", fontWeight: "bold", children: results.length })] })] })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "medium", mb: 3, children: "Content Analysis" }), _jsx(Code, { p: 4, borderRadius: "md", fontSize: "sm", whiteSpace: "pre-wrap", children: "Content analysis would go here in a production implementation. This would include sentiment analysis, readability metrics, keyword extraction, and other NLP insights." })] })] }));
};
