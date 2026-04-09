export const showSuccessToast = (message): any => {
    toast.success(message, {
        duration: 4000,
        position: bottom-right',
    });
};
export const showErrorToast = (message): any => {
    toast.error(message, {
        duration: 4000,
        position: bottom-right',
    });
};
export const showInfoToast = (message): any => {
    toast(message, {
        duration: 4000,
        position: bottom-right',
    });
};
export default {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
};
//# sourceMappingURL=toast.js.map