export var DataType;
(function (DataType) {
    DataType["TEXT"] = "TEXT";
    DataType["NUMBER"] = "NUMBER";
    DataType["BOOLEAN"] = "BOOLEAN";
    DataType["SINGLE_SELECT"] = "SINGLE_SELECT";
    DataType["LONG_TEXT"] = "LONG_TEXT";
    DataType["LINKED_RECORD"] = "LINKED_RECORD";
    DataType["FORMULA"] = "FORMULA";
    DataType["DATE"] = "DATE";
    DataType["ATTACHMENT"] = "ATTACHMENT";
    DataType["URL"] = "URL";
    DataType["EMAIL"] = "EMAIL";
    DataType["CREATED_TIME"] = "CREATED_TIME";
    DataType["LAST_MODIFIED_TIME"] = "LAST_MODIFIED_TIME";
    DataType["VOTES"] = "VOTES";
})(DataType || (DataType = {}));
export var ViewType;
(function (ViewType) {
    ViewType["GRID"] = "GRID";
    ViewType["KANBAN"] = "KANBAN";
    ViewType["CALENDAR"] = "CALENDAR";
    ViewType["GALLERY"] = "GALLERY";
    ViewType["TIMELINE"] = "TIMELINE";
})(ViewType || (ViewType = {}));
export var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQ"] = "EQ";
    FilterOperator["NEQ"] = "NEQ";
    FilterOperator["GT"] = "GT";
    FilterOperator["LT"] = "LT";
    FilterOperator["GTE"] = "GTE";
    FilterOperator["LTE"] = "LTE";
    FilterOperator["CONTAINS"] = "CONTAINS";
    FilterOperator["NOT_CONTAINS"] = "NOT_CONTAINS";
    FilterOperator["IS_EMPTY"] = "IS_EMPTY";
    FilterOperator["IS_NOT_EMPTY"] = "IS_NOT_EMPTY";
})(FilterOperator || (FilterOperator = {}));
//# sourceMappingURL=types.js.map