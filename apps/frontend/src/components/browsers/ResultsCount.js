import { jsxs as _jsxs } from "react/jsx-runtime";
export function ResultsCount(_a) {
    var count = _a.count, _b = _a.singularLabel, singularLabel = _b === void 0 ? 'result' : _b, _c = _a.pluralLabel, pluralLabel = _c === void 0 ? 'results' : _c;
    return (_jsxs("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: ["Showing ", count, " ", count === 1 ? singularLabel : pluralLabel] }));
}
