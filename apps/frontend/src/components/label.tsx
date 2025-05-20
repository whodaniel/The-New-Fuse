var __rest = (this && this.__rest) || function (s, e): any {
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
export {}
exports.Label = Label;
import react_1 from 'react';
function Label(_a): any {
    var { children } = _a, props = __rest(_a, ["children"]);
    return (<label {...props}>
      {children}
    </label>);
}
export {};
//# sourceMappingURL=label.js.map