"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showInfoToast = exports.showErrorToast = exports.showSuccessToast = void 0;
// @ts-checkimport { toast } from 'react-hot-toast';
const showSuccessToast = (message) => {
    toast.success(message, {
        duration: 4000,
        position: 'bottom-right',
    });
};
exports.showSuccessToast = showSuccessToast;
const showErrorToast = (message) => {
    toast.error(message, {
        duration: 4000,
        position: 'bottom-right',
    });
};
exports.showErrorToast = showErrorToast;
const showInfoToast = (message) => {
    toast(message, {
        duration: 4000,
        position: 'bottom-right',
    });
};
exports.showInfoToast = showInfoToast;
exports.default = {
    showSuccessToast: exports.showSuccessToast,
    showErrorToast: exports.showErrorToast,
    showInfoToast: exports.showInfoToast,
};
//# sourceMappingURL=toast.js.map
//# sourceMappingURL=toast.js.map