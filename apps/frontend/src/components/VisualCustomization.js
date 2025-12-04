import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
require("./VisualCustomization.css");
var VisualCustomization = function () {
    var _a = (0, react_1.useState)(''), bodyType = _a[0], setBodyType = _a[1];
    var _b = (0, react_1.useState)(''), facialFeatures = _b[0], setFacialFeatures = _b[1];
    var _c = (0, react_1.useState)(''), clothing = _c[0], setClothing = _c[1];
    var _d = (0, react_1.useState)(''), accessories = _d[0], setAccessories = _d[1];
    var handleBodyTypeChange = function (event) {
        setBodyType(event.target.value);
    };
    var handleFacialFeaturesChange = function (event) {
        setFacialFeatures(event.target.value);
    };
    var handleClothingChange = function (event) {
        setClothing(event.target.value);
    };
    var handleAccessoriesChange = function (event) {
        setAccessories(event.target.value);
    };
    return (_jsxs("div", { className: "visual-customization", children: [_jsx("h2", { children: "Visual Customization" }), _jsxs("div", { children: [_jsx("label", { children: "Body Type:" }), _jsxs("select", { value: bodyType, onChange: handleBodyTypeChange, children: [_jsx("option", { value: "", disabled: true, children: "Select Body Type" }), _jsx("option", { value: "human", children: "Human" }), _jsx("option", { value: "elf", children: "Elf" }), _jsx("option", { value: "dwarf", children: "Dwarf" })] })] }), _jsxs("div", { children: [_jsx("label", { children: "Facial Features:" }), _jsxs("select", { value: facialFeatures, onChange: handleFacialFeaturesChange, children: [_jsx("option", { value: "", disabled: true, children: "Select Facial Features" }), _jsx("option", { value: "beard", children: "Beard" }), _jsx("option", { value: "glasses", children: "Glasses" }), _jsx("option", { value: "mustache", children: "Mustache" })] })] }), _jsxs("div", { children: [_jsx("label", { children: "Clothing:" }), _jsxs("select", { value: clothing, onChange: handleClothingChange, children: [_jsx("option", { value: "", disabled: true, children: "Select Clothing" }), _jsx("option", { value: "robe", children: "Robe" }), _jsx("option", { value: "armor", children: "Armor" }), _jsx("option", { value: "casual", children: "Casual" })] })] }), _jsxs("div", { children: [_jsx("label", { children: "Accessories:" }), _jsxs("select", { value: accessories, onChange: handleAccessoriesChange, children: [_jsx("option", { value: "", disabled: true, children: "Select Accessories" }), _jsx("option", { value: "sword", children: "Sword" }), _jsx("option", { value: "staff", children: "Staff" }), _jsx("option", { value: "backpack", children: "Backpack" })] })] })] }));
};
exports.default = VisualCustomization;
