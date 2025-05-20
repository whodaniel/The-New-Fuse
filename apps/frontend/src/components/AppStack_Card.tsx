Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStack_CardContent = exports.AppStack_CardDescription = exports.AppStack_CardTitle = exports.AppStack_CardHeader = exports.AppStack_Card = void 0;
import react_1 from 'react';
const AppStack_Card = ({ children, variant = 'default', className = '' }) => {
    const baseStyles = "rounded-xl transition-all duration-200";
    const variantStyles = {
        default: "bg-white border shadow-lg hover:shadow-xl",
        gradient: "bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-xl hover:shadow-2xl",
        hover: "bg-white border hover:border-blue-500 shadow-lg hover:shadow-xl hover:scale-[1.02]"
    };
    return (<div className={`${baseStyles} ${variantStyles[variant]} ${className} p-6`}>
      {children}
    </div>);
};
exports.AppStack_Card = AppStack_Card;
const AppStack_CardHeader = ({ children, className = '' }) => {
    return <div className={`space-y-1.5 mb-4 ${className}`}>{children}</div>;
};
exports.AppStack_CardHeader = AppStack_CardHeader;
const AppStack_CardTitle = ({ children, className = '' }) => {
    return (<h3 className={`text-2xl font-semibold tracking-tight text-gray-900 ${className}`}>
      {children}
    </h3>);
};
exports.AppStack_CardTitle = AppStack_CardTitle;
const AppStack_CardDescription = ({ children, className = '' }) => {
    return (<p className={`text-sm text-gray-500 ${className}`}>
      {children}
    </p>);
};
exports.AppStack_CardDescription = AppStack_CardDescription;
const AppStack_CardContent = ({ children, className = '' }) => {
    return <div className={className}>{children}</div>;
};
exports.AppStack_CardContent = AppStack_CardContent;
export {};
//# sourceMappingURL=AppStack_Card.js.map