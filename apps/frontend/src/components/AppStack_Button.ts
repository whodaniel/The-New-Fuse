var __importDefault = (this && this.__importDefault) || function (mod): any {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
export {}
exports.AppStack_Button = void 0;
const react_1 = __importDefault(require("react"));
const AppStack_Button = ({ onClick, variant = 'default', children, disabled, className = '' }): any => {
    const baseStyles = "p-2 rounded transition-all duration-200";
    const variantStyles = variant === 'destructive'
        ? 'bg-red-500 hover:bg-red-600 text-white'
        : 'bg-blue-500 hover:bg-blue-600 text-white';
    return (react_1.default.createElement("button", { onClick: onClick, className: `${baseStyles} ${variantStyles} ${className}`, disabled: disabled }, children));
};
exports.AppStack_Button = AppStack_Button;
export {};
//# sourceMappingURL=AppStack_Button.js.map