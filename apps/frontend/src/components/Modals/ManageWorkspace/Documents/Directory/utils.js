import strDistance from "js-levenshtein";
var LEVENSHTEIN_MIN = 2;
var uuidPattern = /-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
var jsonPattern = /\.json$/;
export var stripUuidAndJsonFromString = function (input) {
    var _a, _b, _c;
    if (input === void 0) { input = ""; }
    return (_c = (_b = (_a = input === null || input === void 0 ? void 0 : input.replace(uuidPattern, "")) === null || _a === void 0 ? void 0 : _a.replace(jsonPattern, "")) === null || _b === void 0 ? void 0 : _b.replace("-", " ")) !== null && _c !== void 0 ? _c : "";
};
export function filterFileSearchResults(files, searchTerm) {
    if (searchTerm === void 0) { searchTerm = ""; }
    if (!searchTerm)
        return (files === null || files === void 0 ? void 0 : files.items) || [];
    var normalizedSearchTerm = searchTerm.toLowerCase().trim();
    var searchResult = [];
    for (var _i = 0, _a = (files === null || files === void 0 ? void 0 : files.items) || []; _i < _a.length; _i++) {
        var folder = _a[_i];
        var folderNameNormalized = folder.name.toLowerCase();
        if (folderNameNormalized.includes(normalizedSearchTerm)) {
            searchResult.push(folder);
            continue;
        }
        var fileSearchResults = [];
        for (var _b = 0, _c = folder === null || folder === void 0 ? void 0 : folder.items; _b < _c.length; _b++) {
            var file = _c[_b];
            var fileNameNormalized = stripUuidAndJsonFromString(file.name).toLowerCase();
            if (fileNameNormalized.includes(normalizedSearchTerm)) {
                fileSearchResults.push(file);
            }
            else if (fileSearchResults.length === 0 &&
                strDistance(fileNameNormalized, normalizedSearchTerm) <= LEVENSHTEIN_MIN) {
                fileSearchResults.push(file);
            }
        }
        if (fileSearchResults.length > 0) {
            searchResult.push(Object.assign(Object.assign({}, folder), { items: fileSearchResults }));
        }
    }
    return searchResult;
}
